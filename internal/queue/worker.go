package queue

import (
	"fmt"
	"sync"
	"time"

	"github.com/aristath/sentinel/internal/events"
	"github.com/rs/zerolog"
)

// WorkerPool manages workers that process jobs
type WorkerPool struct {
	manager      *Manager
	registry     *Registry
	workers      int
	stop         chan struct{}
	log          zerolog.Logger
	stopped      bool
	started      bool
	mu           sync.Mutex
	eventManager *events.Manager
}

// NewWorkerPool creates a new worker pool
func NewWorkerPool(manager *Manager, registry *Registry, workers int) *WorkerPool {
	return &WorkerPool{
		manager:  manager,
		registry: registry,
		workers:  workers,
		stop:     make(chan struct{}),
		log:      zerolog.Nop(),
	}
}

// SetLogger sets the logger for the worker pool
func (wp *WorkerPool) SetLogger(log zerolog.Logger) {
	wp.log = log.With().Str("component", "worker_pool").Logger()
}

// SetEventManager sets the event manager for the worker pool
func (wp *WorkerPool) SetEventManager(em *events.Manager) {
	wp.eventManager = em
}

// Start starts the worker pool
func (wp *WorkerPool) Start() {
	wp.mu.Lock()
	defer wp.mu.Unlock()

	// Prevent multiple starts
	if wp.started && !wp.stopped {
		wp.log.Warn().Msg("Worker pool already started, ignoring")
		return
	}

	if wp.stopped {
		// Reset stop channel if it was stopped
		wp.stop = make(chan struct{})
		wp.stopped = false
	}

	wp.started = true
	for i := 0; i < wp.workers; i++ {
		go wp.worker(i)
	}
}

// Stop stops the worker pool
func (wp *WorkerPool) Stop() {
	wp.mu.Lock()
	defer wp.mu.Unlock()
	if !wp.stopped {
		close(wp.stop)
		wp.stopped = true
		wp.started = false
		wp.log.Info().Msg("Worker pool stopped")
	}
}

func (wp *WorkerPool) worker(id int) {
	wp.log.Debug().Int("worker_id", id).Msg("Worker started")

	for {
		select {
		case <-wp.stop:
			wp.log.Debug().Int("worker_id", id).Msg("Worker stopped")
			return
		default:
			job, err := wp.manager.Dequeue()
			if err != nil {
				// Queue empty, wait a bit
				time.Sleep(100 * time.Millisecond)
				continue
			}

			wp.processJob(job)
		}
	}
}

func (wp *WorkerPool) processJob(job *Job) {
	startTime := time.Now()

	// Inject progress reporter
	if wp.eventManager != nil {
		job.progressReporter = NewProgressReporter(wp.eventManager, job.ID, job.Type)
	}

	// Emit JOB_STARTED event
	if wp.eventManager != nil {
		wp.eventManager.EmitTyped(events.JobStarted, "queue", &events.JobStatusData{
			JobID:       job.ID,
			JobType:     string(job.Type),
			Status:      "started",
			Description: GetJobDescription(job.Type),
			Timestamp:   startTime,
		})
	}

	// Recover from panics in job handlers
	defer func() {
		if r := recover(); r != nil {
			duration := time.Since(startTime).Seconds()
			wp.log.Error().
				Interface("panic", r).
				Str("job_id", job.ID).
				Str("job_type", string(job.Type)).
				Float64("duration", duration).
				Msg("Job handler panicked")

			// Emit JOB_FAILED event for panic
			if wp.eventManager != nil {
				wp.eventManager.EmitTyped(events.JobFailed, "queue", &events.JobStatusData{
					JobID:       job.ID,
					JobType:     string(job.Type),
					Status:      "failed",
					Description: GetJobDescription(job.Type),
					Error:       fmt.Sprintf("panic: %v", r),
					Duration:    duration,
					Timestamp:   time.Now(),
				})
			}

			if err := wp.manager.RecordExecution(job.Type, "failed"); err != nil {
				wp.log.Error().Err(err).Str("job_type", string(job.Type)).Msg("Failed to record execution after panic")
			}
		}
	}()

	wp.log.Debug().
		Str("job_id", job.ID).
		Str("job_type", string(job.Type)).
		Msg("Processing job")

	handler, exists := wp.registry.Get(job.Type)
	if !exists {
		wp.log.Error().
			Str("job_id", job.ID).
			Str("job_type", string(job.Type)).
			Msg("No handler registered for job type")
		if err := wp.manager.RecordExecution(job.Type, "failed"); err != nil {
			wp.log.Error().Err(err).Str("job_type", string(job.Type)).Msg("Failed to record execution for missing handler")
		}
		return
	}

	err := handler(job)
	duration := time.Since(startTime).Seconds()

	if err != nil {
		wp.log.Error().
			Err(err).
			Str("job_id", job.ID).
			Str("job_type", string(job.Type)).
			Int("retries", job.Retries).
			Float64("duration", duration).
			Msg("Job failed")

		// Retry if not exceeded max retries
		if job.Retries < job.MaxRetries {
			job.Retries++
			// Exponential backoff
			delay := time.Duration(job.Retries) * time.Second
			job.AvailableAt = time.Now().Add(delay)
			if err := wp.manager.Enqueue(job); err != nil {
				wp.log.Error().Err(err).Str("job_id", job.ID).Msg("Failed to enqueue job for retry")
				// Record failure since we can't retry
				if recordErr := wp.manager.RecordExecution(job.Type, "failed"); recordErr != nil {
					wp.log.Error().Err(recordErr).Str("job_type", string(job.Type)).Msg("Failed to record execution after enqueue failure")
				}

				// Emit JOB_FAILED event since we can't retry
				if wp.eventManager != nil {
					wp.eventManager.EmitTyped(events.JobFailed, "queue", &events.JobStatusData{
						JobID:       job.ID,
						JobType:     string(job.Type),
						Status:      "failed",
						Description: GetJobDescription(job.Type),
						Error:       err.Error(),
						Duration:    duration,
						Timestamp:   time.Now(),
					})
				}
			} else {
				wp.log.Debug().
					Str("job_id", job.ID).
					Int("retries", job.Retries).
					Dur("delay", delay).
					Msg("Retrying job")
				// Don't emit failure event for retries - will emit new started event when retried
			}
		} else {
			wp.log.Error().
				Str("job_id", job.ID).
				Str("job_type", string(job.Type)).
				Msg("Job failed after max retries")

			// Emit JOB_FAILED event after max retries
			if wp.eventManager != nil {
				wp.eventManager.EmitTyped(events.JobFailed, "queue", &events.JobStatusData{
					JobID:       job.ID,
					JobType:     string(job.Type),
					Status:      "failed",
					Description: GetJobDescription(job.Type),
					Error:       err.Error(),
					Duration:    duration,
					Timestamp:   time.Now(),
				})
			}

			if err := wp.manager.RecordExecution(job.Type, "failed"); err != nil {
				wp.log.Error().Err(err).Str("job_type", string(job.Type)).Msg("Failed to record execution after max retries")
			}
		}
		return
	}

	wp.log.Debug().
		Str("job_id", job.ID).
		Str("job_type", string(job.Type)).
		Float64("duration", duration).
		Msg("Job completed successfully")

	// Emit JOB_COMPLETED event
	if wp.eventManager != nil {
		wp.eventManager.EmitTyped(events.JobCompleted, "queue", &events.JobStatusData{
			JobID:       job.ID,
			JobType:     string(job.Type),
			Status:      "completed",
			Description: GetJobDescription(job.Type),
			Duration:    duration,
			Timestamp:   time.Now(),
		})
	}

	if err := wp.manager.RecordExecution(job.Type, "success"); err != nil {
		wp.log.Error().Err(err).Str("job_type", string(job.Type)).Msg("Failed to record successful execution")
	}
}
