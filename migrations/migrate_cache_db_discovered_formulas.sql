-- Migration script for cache.db - discovered_formulas table
-- Converts discovered_at from TEXT to INTEGER Unix timestamp
-- Run this script on the Arduino device: sqlite3 cache.db < migrate_cache_db_discovered_formulas.sql
-- Note: This table may be in cache.db or a separate database depending on your setup

-- ============================================================================
-- DISCOVERED_FORMULAS TABLE
-- ============================================================================
-- Migrate discovered_at
ALTER TABLE discovered_formulas ADD COLUMN discovered_at_new INTEGER;
UPDATE discovered_formulas SET discovered_at_new = strftime('%s', discovered_at) WHERE discovered_at IS NOT NULL;
ALTER TABLE discovered_formulas DROP COLUMN discovered_at;
ALTER TABLE discovered_formulas RENAME COLUMN discovered_at_new TO discovered_at;

-- Migrate created_at (if it exists and is TEXT)
-- Note: created_at may already be INTEGER with DEFAULT, but migrate if needed
ALTER TABLE discovered_formulas ADD COLUMN created_at_new INTEGER;
UPDATE discovered_formulas SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL AND typeof(created_at) = 'text';
ALTER TABLE discovered_formulas DROP COLUMN created_at;
ALTER TABLE discovered_formulas RENAME COLUMN created_at_new TO created_at;
