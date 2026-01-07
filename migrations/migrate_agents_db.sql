-- Migration script for agents.db
-- Converts all TEXT date/timestamp columns to INTEGER Unix timestamps
-- Run this script on the Arduino device: sqlite3 agents.db < migrate_agents_db.sql

-- ============================================================================
-- SEQUENCES TABLE
-- ============================================================================
-- Migrate evaluated_at
ALTER TABLE sequences ADD COLUMN evaluated_at_new INTEGER;
UPDATE sequences SET evaluated_at_new = strftime('%s', evaluated_at) WHERE evaluated_at IS NOT NULL;
ALTER TABLE sequences DROP COLUMN evaluated_at;
ALTER TABLE sequences RENAME COLUMN evaluated_at_new TO evaluated_at;

-- Migrate created_at
ALTER TABLE sequences ADD COLUMN created_at_new INTEGER;
UPDATE sequences SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE sequences DROP COLUMN created_at;
ALTER TABLE sequences RENAME COLUMN created_at_new TO created_at;

-- ============================================================================
-- EVALUATIONS TABLE
-- ============================================================================
-- Migrate evaluated_at
ALTER TABLE evaluations ADD COLUMN evaluated_at_new INTEGER;
UPDATE evaluations SET evaluated_at_new = strftime('%s', evaluated_at) WHERE evaluated_at IS NOT NULL;
ALTER TABLE evaluations DROP COLUMN evaluated_at;
ALTER TABLE evaluations RENAME COLUMN evaluated_at_new TO evaluated_at;

-- ============================================================================
-- BEST_RESULT TABLE
-- ============================================================================
-- Migrate created_at
ALTER TABLE best_result ADD COLUMN created_at_new INTEGER;
UPDATE best_result SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE best_result DROP COLUMN created_at;
ALTER TABLE best_result RENAME COLUMN created_at_new TO created_at;

-- Migrate updated_at
ALTER TABLE best_result ADD COLUMN updated_at_new INTEGER;
UPDATE best_result SET updated_at_new = strftime('%s', updated_at) WHERE updated_at IS NOT NULL;
ALTER TABLE best_result DROP COLUMN updated_at;
ALTER TABLE best_result RENAME COLUMN updated_at_new TO updated_at;
