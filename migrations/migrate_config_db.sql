-- Migration script for config.db
-- Converts all TEXT date/timestamp columns to INTEGER Unix timestamps
-- Run this script on the Arduino device: sqlite3 config.db < migrate_config_db.sql

-- ============================================================================
-- SETTINGS TABLE
-- ============================================================================
-- Migrate updated_at
ALTER TABLE settings ADD COLUMN updated_at_new INTEGER;
UPDATE settings SET updated_at_new = strftime('%s', updated_at) WHERE updated_at IS NOT NULL;
ALTER TABLE settings DROP COLUMN updated_at;
ALTER TABLE settings RENAME COLUMN updated_at_new TO updated_at;

-- ============================================================================
-- ALLOCATION_TARGETS TABLE
-- ============================================================================
-- Migrate created_at
ALTER TABLE allocation_targets ADD COLUMN created_at_new INTEGER;
UPDATE allocation_targets SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE allocation_targets DROP COLUMN created_at;
ALTER TABLE allocation_targets RENAME COLUMN created_at_new TO created_at;

-- Migrate updated_at
ALTER TABLE allocation_targets ADD COLUMN updated_at_new INTEGER;
UPDATE allocation_targets SET updated_at_new = strftime('%s', updated_at) WHERE updated_at IS NOT NULL;
ALTER TABLE allocation_targets DROP COLUMN updated_at;
ALTER TABLE allocation_targets RENAME COLUMN updated_at_new TO updated_at;

-- ============================================================================
-- PLANNER_SETTINGS TABLE
-- ============================================================================
-- Migrate updated_at
ALTER TABLE planner_settings ADD COLUMN updated_at_new INTEGER;
UPDATE planner_settings SET updated_at_new = strftime('%s', updated_at) WHERE updated_at IS NOT NULL;
ALTER TABLE planner_settings DROP COLUMN updated_at;
ALTER TABLE planner_settings RENAME COLUMN updated_at_new TO updated_at;

-- ============================================================================
-- MARKET_REGIME_HISTORY TABLE
-- ============================================================================
-- Migrate recorded_at
ALTER TABLE market_regime_history ADD COLUMN recorded_at_new INTEGER;
UPDATE market_regime_history SET recorded_at_new = strftime('%s', recorded_at) WHERE recorded_at IS NOT NULL;
ALTER TABLE market_regime_history DROP COLUMN recorded_at;
ALTER TABLE market_regime_history RENAME COLUMN recorded_at_new TO recorded_at;

-- Migrate created_at
ALTER TABLE market_regime_history ADD COLUMN created_at_new INTEGER;
UPDATE market_regime_history SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE market_regime_history DROP COLUMN created_at;
ALTER TABLE market_regime_history RENAME COLUMN created_at_new TO created_at;

-- ============================================================================
-- ADAPTIVE_PERFORMANCE_HISTORY TABLE
-- ============================================================================
-- Migrate recorded_at
ALTER TABLE adaptive_performance_history ADD COLUMN recorded_at_new INTEGER;
UPDATE adaptive_performance_history SET recorded_at_new = strftime('%s', recorded_at) WHERE recorded_at IS NOT NULL;
ALTER TABLE adaptive_performance_history DROP COLUMN recorded_at;
ALTER TABLE adaptive_performance_history RENAME COLUMN recorded_at_new TO recorded_at;

-- Migrate created_at
ALTER TABLE adaptive_performance_history ADD COLUMN created_at_new INTEGER;
UPDATE adaptive_performance_history SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE adaptive_performance_history DROP COLUMN created_at;
ALTER TABLE adaptive_performance_history RENAME COLUMN created_at_new TO created_at;

-- ============================================================================
-- ADAPTIVE_PARAMETERS TABLE
-- ============================================================================
-- Migrate adapted_at
ALTER TABLE adaptive_parameters ADD COLUMN adapted_at_new INTEGER;
UPDATE adaptive_parameters SET adapted_at_new = strftime('%s', adapted_at) WHERE adapted_at IS NOT NULL;
ALTER TABLE adaptive_parameters DROP COLUMN adapted_at;
ALTER TABLE adaptive_parameters RENAME COLUMN adapted_at_new TO adapted_at;

-- Migrate created_at
ALTER TABLE adaptive_parameters ADD COLUMN created_at_new INTEGER;
UPDATE adaptive_parameters SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE adaptive_parameters DROP COLUMN created_at;
ALTER TABLE adaptive_parameters RENAME COLUMN created_at_new TO created_at;
