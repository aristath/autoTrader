-- Migration script for cache.db
-- Converts all TEXT date/timestamp columns to INTEGER Unix timestamps
-- Run this script on the Arduino device: sqlite3 cache.db < migrate_cache_db.sql

-- ============================================================================
-- RECOMMENDATIONS TABLE
-- ============================================================================
-- Migrate created_at
ALTER TABLE recommendations ADD COLUMN created_at_new INTEGER;
UPDATE recommendations SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE recommendations DROP COLUMN created_at;
ALTER TABLE recommendations RENAME COLUMN created_at_new TO created_at;

-- Migrate updated_at
ALTER TABLE recommendations ADD COLUMN updated_at_new INTEGER;
UPDATE recommendations SET updated_at_new = strftime('%s', updated_at) WHERE updated_at IS NOT NULL;
ALTER TABLE recommendations DROP COLUMN updated_at;
ALTER TABLE recommendations RENAME COLUMN updated_at_new TO updated_at;

-- Migrate executed_at
ALTER TABLE recommendations ADD COLUMN executed_at_new INTEGER;
UPDATE recommendations SET executed_at_new = strftime('%s', executed_at) WHERE executed_at IS NOT NULL;
ALTER TABLE recommendations DROP COLUMN executed_at;
ALTER TABLE recommendations RENAME COLUMN executed_at_new TO executed_at;

-- ============================================================================
-- JOB_HISTORY TABLE
-- ============================================================================
-- Migrate last_run_at
ALTER TABLE job_history ADD COLUMN last_run_at_new INTEGER;
UPDATE job_history SET last_run_at_new = strftime('%s', last_run_at) WHERE last_run_at IS NOT NULL;
ALTER TABLE job_history DROP COLUMN last_run_at;
ALTER TABLE job_history RENAME COLUMN last_run_at_new TO last_run_at;
