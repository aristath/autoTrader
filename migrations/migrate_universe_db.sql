-- Migration script for universe.db
-- Converts all TEXT date/timestamp columns to INTEGER Unix timestamps
-- Run this script on the Arduino device: sqlite3 universe.db < migrate_universe_db.sql

-- ============================================================================
-- SECURITIES TABLE
-- ============================================================================
-- Migrate last_synced
ALTER TABLE securities ADD COLUMN last_synced_new INTEGER;
UPDATE securities SET last_synced_new = strftime('%s', last_synced) WHERE last_synced IS NOT NULL;
ALTER TABLE securities DROP COLUMN last_synced;
ALTER TABLE securities RENAME COLUMN last_synced_new TO last_synced;

-- Migrate created_at
ALTER TABLE securities ADD COLUMN created_at_new INTEGER;
UPDATE securities SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE securities DROP COLUMN created_at;
ALTER TABLE securities RENAME COLUMN created_at_new TO created_at;

-- Migrate updated_at
ALTER TABLE securities ADD COLUMN updated_at_new INTEGER;
UPDATE securities SET updated_at_new = strftime('%s', updated_at) WHERE updated_at IS NOT NULL;
ALTER TABLE securities DROP COLUMN updated_at;
ALTER TABLE securities RENAME COLUMN updated_at_new TO updated_at;

-- ============================================================================
-- COUNTRY_GROUPS TABLE
-- ============================================================================
-- Migrate created_at
ALTER TABLE country_groups ADD COLUMN created_at_new INTEGER;
UPDATE country_groups SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE country_groups DROP COLUMN created_at;
ALTER TABLE country_groups RENAME COLUMN created_at_new TO created_at;

-- Migrate updated_at
ALTER TABLE country_groups ADD COLUMN updated_at_new INTEGER;
UPDATE country_groups SET updated_at_new = strftime('%s', updated_at) WHERE updated_at IS NOT NULL;
ALTER TABLE country_groups DROP COLUMN updated_at;
ALTER TABLE country_groups RENAME COLUMN updated_at_new TO updated_at;

-- ============================================================================
-- INDUSTRY_GROUPS TABLE
-- ============================================================================
-- Migrate created_at
ALTER TABLE industry_groups ADD COLUMN created_at_new INTEGER;
UPDATE industry_groups SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE industry_groups DROP COLUMN created_at;
ALTER TABLE industry_groups RENAME COLUMN created_at_new TO created_at;

-- Migrate updated_at
ALTER TABLE industry_groups ADD COLUMN updated_at_new INTEGER;
UPDATE industry_groups SET updated_at_new = strftime('%s', updated_at) WHERE updated_at IS NOT NULL;
ALTER TABLE industry_groups DROP COLUMN updated_at;
ALTER TABLE industry_groups RENAME COLUMN updated_at_new TO updated_at;

-- ============================================================================
-- TAGS TABLE
-- ============================================================================
-- Migrate created_at
ALTER TABLE tags ADD COLUMN created_at_new INTEGER;
UPDATE tags SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE tags DROP COLUMN created_at;
ALTER TABLE tags RENAME COLUMN created_at_new TO created_at;

-- Migrate updated_at
ALTER TABLE tags ADD COLUMN updated_at_new INTEGER;
UPDATE tags SET updated_at_new = strftime('%s', updated_at) WHERE updated_at IS NOT NULL;
ALTER TABLE tags DROP COLUMN updated_at;
ALTER TABLE tags RENAME COLUMN updated_at_new TO updated_at;

-- ============================================================================
-- SECURITY_TAGS TABLE
-- ============================================================================
-- Note: created_at and updated_at should already be INTEGER, but migrate if needed
-- Migrate created_at
ALTER TABLE security_tags ADD COLUMN created_at_new INTEGER;
UPDATE security_tags SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL AND typeof(created_at) = 'text';
ALTER TABLE security_tags DROP COLUMN created_at;
ALTER TABLE security_tags RENAME COLUMN created_at_new TO created_at;

-- Migrate updated_at
ALTER TABLE security_tags ADD COLUMN updated_at_new INTEGER;
UPDATE security_tags SET updated_at_new = strftime('%s', updated_at) WHERE updated_at IS NOT NULL AND typeof(updated_at) = 'text';
ALTER TABLE security_tags DROP COLUMN updated_at;
ALTER TABLE security_tags RENAME COLUMN updated_at_new TO updated_at;
