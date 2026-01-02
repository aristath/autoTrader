package locking

import (
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestLockDir(t *testing.T) string {
	// Create temporary directory for locks
	lockDir := filepath.Join(os.TempDir(), "test_locks", t.Name())
	t.Cleanup(func() {
		os.RemoveAll(lockDir)
	})
	return lockDir
}

func TestNewManager_CreatesDirectory(t *testing.T) {
	lockDir := filepath.Join(os.TempDir(), "test_locks_new")
	defer os.RemoveAll(lockDir)

	// Ensure directory doesn't exist
	os.RemoveAll(lockDir)

	manager, err := NewManager(lockDir, zerolog.Nop())
	require.NoError(t, err)
	require.NotNil(t, manager)

	// Verify directory was created
	info, err := os.Stat(lockDir)
	require.NoError(t, err)
	assert.True(t, info.IsDir())
}

func TestNewManager_ExistingDirectory(t *testing.T) {
	lockDir := setupTestLockDir(t)

	// Create directory first
	err := os.MkdirAll(lockDir, 0755)
	require.NoError(t, err)

	// Manager should succeed with existing directory
	manager, err := NewManager(lockDir, zerolog.Nop())
	require.NoError(t, err)
	require.NotNil(t, manager)
}

func TestAcquireLock_Success(t *testing.T) {
	lockDir := setupTestLockDir(t)
	manager, err := NewManager(lockDir, zerolog.Nop())
	require.NoError(t, err)

	// Acquire lock
	lock, err := manager.AcquireLock("test_lock", 5*time.Second)
	require.NoError(t, err)
	require.NotNil(t, lock)

	// Verify lock file was created
	lockPath := filepath.Join(lockDir, "test_lock.lock")
	_, err = os.Stat(lockPath)
	assert.NoError(t, err, "Lock file should exist")

	// Clean up
	lock.Release()
}

func TestAcquireLock_Timeout(t *testing.T) {
	lockDir := setupTestLockDir(t)
	manager, err := NewManager(lockDir, zerolog.Nop())
	require.NoError(t, err)

	// Acquire first lock
	lock1, err := manager.AcquireLock("timeout_test", 5*time.Second)
	require.NoError(t, err)
	defer lock1.Release()

	// Try to acquire same lock with short timeout - should fail
	start := time.Now()
	lock2, err := manager.AcquireLock("timeout_test", 500*time.Millisecond)
	elapsed := time.Since(start)

	assert.Error(t, err)
	assert.Nil(t, lock2)
	assert.Contains(t, err.Error(), "timeout")
	assert.GreaterOrEqual(t, elapsed, 500*time.Millisecond)
	assert.Less(t, elapsed, 1*time.Second, "Should timeout quickly")
}

func TestRelease_Success(t *testing.T) {
	lockDir := setupTestLockDir(t)
	manager, err := NewManager(lockDir, zerolog.Nop())
	require.NoError(t, err)

	lock, err := manager.AcquireLock("release_test", 5*time.Second)
	require.NoError(t, err)

	// Release lock
	err = lock.Release()
	assert.NoError(t, err)
}

func TestRelease_Idempotent(t *testing.T) {
	lockDir := setupTestLockDir(t)
	manager, err := NewManager(lockDir, zerolog.Nop())
	require.NoError(t, err)

	lock, err := manager.AcquireLock("idempotent_test", 5*time.Second)
	require.NoError(t, err)

	// Release multiple times - should not error
	err = lock.Release()
	assert.NoError(t, err)

	err = lock.Release()
	assert.NoError(t, err, "Second release should be idempotent")

	err = lock.Release()
	assert.NoError(t, err, "Third release should be idempotent")
}

func TestAcquireLock_AfterRelease(t *testing.T) {
	lockDir := setupTestLockDir(t)
	manager, err := NewManager(lockDir, zerolog.Nop())
	require.NoError(t, err)

	// Acquire and release first lock
	lock1, err := manager.AcquireLock("reacquire_test", 5*time.Second)
	require.NoError(t, err)

	err = lock1.Release()
	require.NoError(t, err)

	// Should be able to acquire same lock again
	lock2, err := manager.AcquireLock("reacquire_test", 5*time.Second)
	require.NoError(t, err)
	require.NotNil(t, lock2)

	lock2.Release()
}

func TestConcurrentLockAcquisition(t *testing.T) {
	lockDir := setupTestLockDir(t)
	manager, err := NewManager(lockDir, zerolog.Nop())
	require.NoError(t, err)

	const lockName = "concurrent_test"
	var wg sync.WaitGroup
	var mu sync.Mutex
	acquireOrder := []int{}
	releaseOrder := []int{}

	// Goroutine 1: Acquire, hold for 1 second, release
	wg.Add(1)
	go func() {
		defer wg.Done()

		lock, err := manager.AcquireLock(lockName, 5*time.Second)
		if err != nil {
			t.Errorf("Goroutine 1 failed to acquire lock: %v", err)
			return
		}

		mu.Lock()
		acquireOrder = append(acquireOrder, 1)
		mu.Unlock()

		// Hold lock for 1 second
		time.Sleep(1 * time.Second)

		lock.Release()

		mu.Lock()
		releaseOrder = append(releaseOrder, 1)
		mu.Unlock()
	}()

	// Wait a bit to ensure goroutine 1 acquires first
	time.Sleep(100 * time.Millisecond)

	// Goroutine 2: Try to acquire same lock (should block until goroutine 1 releases)
	wg.Add(1)
	go func() {
		defer wg.Done()

		lock, err := manager.AcquireLock(lockName, 5*time.Second)
		if err != nil {
			t.Errorf("Goroutine 2 failed to acquire lock: %v", err)
			return
		}

		mu.Lock()
		acquireOrder = append(acquireOrder, 2)
		mu.Unlock()

		lock.Release()

		mu.Lock()
		releaseOrder = append(releaseOrder, 2)
		mu.Unlock()
	}()

	wg.Wait()

	// Verify acquisition order: goroutine 1 first, then goroutine 2
	assert.Equal(t, []int{1, 2}, acquireOrder, "Goroutine 1 should acquire first, then goroutine 2")

	// Verify release order: goroutine 1 first, then goroutine 2
	assert.Equal(t, []int{1, 2}, releaseOrder, "Goroutine 1 should release first, then goroutine 2")
}

func TestConcurrentLockAcquisition_Timeout(t *testing.T) {
	lockDir := setupTestLockDir(t)
	manager, err := NewManager(lockDir, zerolog.Nop())
	require.NoError(t, err)

	const lockName = "concurrent_timeout_test"
	var wg sync.WaitGroup

	// Goroutine 1: Acquire and hold for 2 seconds
	wg.Add(1)
	go func() {
		defer wg.Done()

		lock, err := manager.AcquireLock(lockName, 5*time.Second)
		if err != nil {
			t.Errorf("Goroutine 1 failed to acquire lock: %v", err)
			return
		}
		defer lock.Release()

		time.Sleep(2 * time.Second)
	}()

	// Wait to ensure goroutine 1 acquires first
	time.Sleep(100 * time.Millisecond)

	// Goroutine 2: Try to acquire with short timeout (should timeout)
	wg.Add(1)
	go func() {
		defer wg.Done()

		start := time.Now()
		lock, err := manager.AcquireLock(lockName, 500*time.Millisecond)
		elapsed := time.Since(start)

		// Should fail with timeout
		assert.Error(t, err)
		assert.Nil(t, lock)
		assert.Contains(t, err.Error(), "timeout")
		assert.GreaterOrEqual(t, elapsed, 500*time.Millisecond)
	}()

	wg.Wait()
}

func TestMultipleDifferentLocks(t *testing.T) {
	lockDir := setupTestLockDir(t)
	manager, err := NewManager(lockDir, zerolog.Nop())
	require.NoError(t, err)

	// Acquire multiple different locks concurrently
	lock1, err := manager.AcquireLock("lock1", 5*time.Second)
	require.NoError(t, err)
	defer lock1.Release()

	lock2, err := manager.AcquireLock("lock2", 5*time.Second)
	require.NoError(t, err)
	defer lock2.Release()

	lock3, err := manager.AcquireLock("lock3", 5*time.Second)
	require.NoError(t, err)
	defer lock3.Release()

	// Verify all locks exist
	assert.FileExists(t, filepath.Join(lockDir, "lock1.lock"))
	assert.FileExists(t, filepath.Join(lockDir, "lock2.lock"))
	assert.FileExists(t, filepath.Join(lockDir, "lock3.lock"))
}

func TestLockCleanup_Defer(t *testing.T) {
	lockDir := setupTestLockDir(t)
	manager, err := NewManager(lockDir, zerolog.Nop())
	require.NoError(t, err)

	func() {
		lock, err := manager.AcquireLock("defer_test", 5*time.Second)
		require.NoError(t, err)
		defer lock.Release()

		// Lock is acquired here
		// defer will release it on function exit
	}()

	// After function returns, lock should be released
	// Try to acquire it again immediately
	lock2, err := manager.AcquireLock("defer_test", 1*time.Second)
	require.NoError(t, err, "Lock should be released and reacquirable")
	require.NotNil(t, lock2)

	lock2.Release()
}

func TestRealWorldUsage_SyncJob(t *testing.T) {
	// Simulates the cash flow sync job use case
	lockDir := setupTestLockDir(t)
	manager, err := NewManager(lockDir, zerolog.Nop())
	require.NoError(t, err)

	const lockName = "cash_flow_sync"
	const timeout = 120 * time.Second

	// Simulate sync job execution
	syncJob := func() error {
		lock, err := manager.AcquireLock(lockName, timeout)
		if err != nil {
			return err
		}
		defer lock.Release()

		// Simulate sync work
		time.Sleep(100 * time.Millisecond)

		return nil
	}

	// Run sync job
	err = syncJob()
	assert.NoError(t, err)

	// Run sync job again - should succeed (lock was released)
	err = syncJob()
	assert.NoError(t, err)
}

func TestRealWorldUsage_ConcurrentSyncPrevention(t *testing.T) {
	// Simulates two sync jobs trying to run concurrently
	lockDir := setupTestLockDir(t)
	manager, err := NewManager(lockDir, zerolog.Nop())
	require.NoError(t, err)

	const lockName = "cash_flow_sync"
	const timeout = 1 * time.Second

	var wg sync.WaitGroup
	results := make(chan error, 2)

	// Simulate two concurrent sync jobs
	for i := 1; i <= 2; i++ {
		wg.Add(1)
		go func(jobNum int) {
			defer wg.Done()

			lock, err := manager.AcquireLock(lockName, timeout)
			if err != nil {
				results <- err
				return
			}
			defer lock.Release()

			// Simulate work that takes longer than the timeout
			time.Sleep(1500 * time.Millisecond)
			results <- nil
		}(i)
	}

	wg.Wait()
	close(results)

	// Collect results
	successCount := 0
	timeoutCount := 0

	for err := range results {
		if err == nil {
			successCount++
		} else if err.Error() != "" {
			timeoutCount++
		}
	}

	// One should succeed, one should timeout
	assert.Equal(t, 1, successCount, "Exactly one job should succeed")
	assert.Equal(t, 1, timeoutCount, "Exactly one job should timeout")
}
