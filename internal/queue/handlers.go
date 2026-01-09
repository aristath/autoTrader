package queue

import (
	"github.com/aristath/sentinel/internal/scheduler/iface"
)

// JobToHandler converts a scheduler job to a queue.Handler
func JobToHandler(job iface.Job) Handler {
	return func(queueJob *Job) error {
		// Inject queue job reference so job can access progress reporter
		job.SetJob(queueJob)

		return job.Run()
	}
}
