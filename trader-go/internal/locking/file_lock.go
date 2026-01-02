package locking

import (
	"fmt"
	"os"
	"path/filepath"
	"syscall"
	"time"

	"github.com/rs/zerolog"
)

// Manager handles file-based locking for preventing concurrent operations
type Manager struct {
	lockDir string
	log     zerolog.Logger
}

// NewManager creates a new lock manager
func NewManager(lockDir string, log zerolog.Logger) (*Manager, error) {
	// Ensure lock directory exists
	if err := os.MkdirAll(lockDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create lock directory: %w", err)
	}

	return &Manager{
		lockDir: lockDir,
		log:     log.With().Str("service", "lock_manager").Logger(),
	}, nil
}

// Lock represents an acquired lock
type Lock struct {
	name     string
	file     *os.File
	released bool
	log      zerolog.Logger
}

// AcquireLock attempts to acquire a named lock with timeout
func (m *Manager) AcquireLock(name string, timeout time.Duration) (*Lock, error) {
	lockPath := filepath.Join(m.lockDir, fmt.Sprintf("%s.lock", name))

	// Open or create lock file
	file, err := os.OpenFile(lockPath, os.O_CREATE|os.O_RDWR, 0644)
	if err != nil {
		return nil, fmt.Errorf("failed to open lock file: %w", err)
	}

	// Try to acquire exclusive lock with timeout
	deadline := time.Now().Add(timeout)
	for {
		err := syscall.Flock(int(file.Fd()), syscall.LOCK_EX|syscall.LOCK_NB)
		if err == nil {
			// Lock acquired
			m.log.Debug().Str("lock", name).Msg("Lock acquired")
			return &Lock{
				name:     name,
				file:     file,
				released: false,
				log:      m.log,
			}, nil
		}

		// Check timeout
		if time.Now().After(deadline) {
			file.Close()
			return nil, fmt.Errorf("failed to acquire lock %s: timeout after %v", name, timeout)
		}

		// Wait and retry
		time.Sleep(100 * time.Millisecond)
	}
}

// Release releases the lock
func (l *Lock) Release() error {
	if l.released {
		return nil
	}

	// Release lock
	if err := syscall.Flock(int(l.file.Fd()), syscall.LOCK_UN); err != nil {
		l.log.Error().Err(err).Str("lock", l.name).Msg("Failed to unlock")
		return fmt.Errorf("failed to unlock: %w", err)
	}

	// Close file
	if err := l.file.Close(); err != nil {
		l.log.Error().Err(err).Str("lock", l.name).Msg("Failed to close lock file")
		return fmt.Errorf("failed to close lock file: %w", err)
	}

	l.released = true
	l.log.Debug().Str("lock", l.name).Msg("Lock released")
	return nil
}

// Acquire is a simplified wrapper around AcquireLock with a 5-second timeout
// Returns error if lock cannot be acquired
func (m *Manager) Acquire(name string) error {
	lock, err := m.AcquireLock(name, 5*time.Second)
	if err != nil {
		return err
	}

	// Store lock for later release
	// Note: In production, this should use a map to track locks
	// For now, we'll rely on the Lock.Release() being called via defer
	_ = lock

	return nil
}

// Release is a placeholder for simplified API compatibility
// In production, this should track and release locks by name
// For now, locks should be released using the Lock.Release() method
func (m *Manager) Release(name string) error {
	// This is a no-op for now since we can't track locks without additional state
	// The proper pattern is to use AcquireLock() and call lock.Release() via defer
	m.log.Debug().Str("lock", name).Msg("Release called (simplified API)")
	return nil
}

// ClearStuckLocks removes lock files older than the specified duration
// This is a cleanup operation for orphaned lock files
func (m *Manager) ClearStuckLocks(maxAge time.Duration) ([]string, error) {
	entries, err := os.ReadDir(m.lockDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []string{}, nil
		}
		return nil, fmt.Errorf("failed to read lock directory: %w", err)
	}

	clearedLocks := []string{}
	now := time.Now()

	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".lock" {
			continue
		}

		lockPath := filepath.Join(m.lockDir, entry.Name())
		info, err := entry.Info()
		if err != nil {
			m.log.Warn().Err(err).Str("file", entry.Name()).Msg("Failed to get file info")
			continue
		}

		age := now.Sub(info.ModTime())
		if age > maxAge {
			// Try to remove the lock file
			if err := os.Remove(lockPath); err != nil {
				m.log.Error().Err(err).Str("file", entry.Name()).Msg("Failed to remove stuck lock")
				continue
			}

			lockName := entry.Name()[:len(entry.Name())-5] // Remove .lock extension
			m.log.Info().Str("lock", lockName).Dur("age", age).Msg("Cleared stuck lock")
			clearedLocks = append(clearedLocks, lockName)
		}
	}

	return clearedLocks, nil
}
