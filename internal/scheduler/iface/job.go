package iface

// Job represents a schedulable job
type Job interface {
	Run() error
	Name() string
	SetJob(interface{})
}
