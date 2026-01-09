package queue

import (
	"time"

	"github.com/aristath/sentinel/internal/events"
)

// ProgressReporter allows jobs to report progress during execution
type ProgressReporter struct {
	eventManager *events.Manager
	jobID        string
	jobType      JobType
	lastReport   time.Time
	minInterval  time.Duration // Minimum interval between progress reports
}

// NewProgressReporter creates a new progress reporter with throttling
func NewProgressReporter(em *events.Manager, jobID string, jobType JobType) *ProgressReporter {
	return &ProgressReporter{
		eventManager: em,
		jobID:        jobID,
		jobType:      jobType,
		minInterval:  500 * time.Millisecond, // Throttle to max 2 reports/second
	}
}

// Report emits a progress event (throttled to prevent flooding)
func (pr *ProgressReporter) Report(current, total int, message string) {
	if pr.eventManager == nil {
		return
	}

	// Throttle: only report if enough time has passed OR if we're at 100%
	now := time.Now()
	if now.Sub(pr.lastReport) < pr.minInterval && current != total {
		return
	}
	pr.lastReport = now

	pr.eventManager.EmitTyped(events.JobProgress, "queue", &events.JobStatusData{
		JobID:       pr.jobID,
		JobType:     string(pr.jobType),
		Status:      "progress",
		Description: GetJobDescription(pr.jobType),
		Progress: &events.JobProgressInfo{
			Current: current,
			Total:   total,
			Message: message,
		},
		Timestamp: now,
	})
}

// ReportMessage emits a progress message without count (for indeterminate progress)
func (pr *ProgressReporter) ReportMessage(message string) {
	if pr.eventManager == nil {
		return
	}

	now := time.Now()
	if now.Sub(pr.lastReport) < pr.minInterval {
		return
	}
	pr.lastReport = now

	pr.eventManager.EmitTyped(events.JobProgress, "queue", &events.JobStatusData{
		JobID:       pr.jobID,
		JobType:     string(pr.jobType),
		Status:      "progress",
		Description: GetJobDescription(pr.jobType),
		Progress: &events.JobProgressInfo{
			Message: message,
		},
		Timestamp: now,
	})
}
