// Package iface defines the interface for scheduler jobs.
package iface

// Job represents a schedulable job
type Job interface {
	Run() error
	Name() string
	SetJob(interface{})
}
