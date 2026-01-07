-- Migration script for ledger.db
-- Converts all TEXT date/timestamp columns to INTEGER Unix timestamps
-- Run this script on the Arduino device: sqlite3 ledger.db < migrate_ledger_db.sql

-- ============================================================================
-- TRADES TABLE
-- ============================================================================
-- Migrate executed_at
ALTER TABLE trades ADD COLUMN executed_at_new INTEGER;
UPDATE trades SET executed_at_new = strftime('%s', executed_at) WHERE executed_at IS NOT NULL;
ALTER TABLE trades DROP COLUMN executed_at;
ALTER TABLE trades RENAME COLUMN executed_at_new TO executed_at;

-- Migrate created_at
ALTER TABLE trades ADD COLUMN created_at_new INTEGER;
UPDATE trades SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE trades DROP COLUMN created_at;
ALTER TABLE trades RENAME COLUMN created_at_new TO created_at;

-- ============================================================================
-- CASH_FLOWS TABLE
-- ============================================================================
-- Migrate date (YYYY-MM-DD to Unix timestamp at midnight UTC)
ALTER TABLE cash_flows ADD COLUMN date_new INTEGER;
UPDATE cash_flows SET date_new = strftime('%s', date || ' 00:00:00') WHERE date IS NOT NULL;
ALTER TABLE cash_flows DROP COLUMN date;
ALTER TABLE cash_flows RENAME COLUMN date_new TO date;

-- Migrate created_at
ALTER TABLE cash_flows ADD COLUMN created_at_new INTEGER;
UPDATE cash_flows SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE cash_flows DROP COLUMN created_at;
ALTER TABLE cash_flows RENAME COLUMN created_at_new TO created_at;

-- ============================================================================
-- DIVIDEND_HISTORY TABLE
-- ============================================================================
-- Migrate payment_date (YYYY-MM-DD to Unix timestamp at midnight UTC)
ALTER TABLE dividend_history ADD COLUMN payment_date_new INTEGER;
UPDATE dividend_history SET payment_date_new = strftime('%s', payment_date || ' 00:00:00') WHERE payment_date IS NOT NULL;
ALTER TABLE dividend_history DROP COLUMN payment_date;
ALTER TABLE dividend_history RENAME COLUMN payment_date_new TO payment_date;

-- Migrate reinvested_at
ALTER TABLE dividend_history ADD COLUMN reinvested_at_new INTEGER;
UPDATE dividend_history SET reinvested_at_new = strftime('%s', reinvested_at) WHERE reinvested_at IS NOT NULL;
ALTER TABLE dividend_history DROP COLUMN reinvested_at;
ALTER TABLE dividend_history RENAME COLUMN reinvested_at_new TO reinvested_at;

-- Migrate cleared_at
ALTER TABLE dividend_history ADD COLUMN cleared_at_new INTEGER;
UPDATE dividend_history SET cleared_at_new = strftime('%s', cleared_at) WHERE cleared_at IS NOT NULL;
ALTER TABLE dividend_history DROP COLUMN cleared_at;
ALTER TABLE dividend_history RENAME COLUMN cleared_at_new TO cleared_at;

-- Migrate created_at
ALTER TABLE dividend_history ADD COLUMN created_at_new INTEGER;
UPDATE dividend_history SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE dividend_history DROP COLUMN created_at;
ALTER TABLE dividend_history RENAME COLUMN created_at_new TO created_at;

-- ============================================================================
-- DRIP_TRACKING TABLE
-- ============================================================================
-- Migrate last_dividend_date (YYYY-MM-DD to Unix timestamp at midnight UTC)
ALTER TABLE drip_tracking ADD COLUMN last_dividend_date_new INTEGER;
UPDATE drip_tracking SET last_dividend_date_new = strftime('%s', last_dividend_date || ' 00:00:00') WHERE last_dividend_date IS NOT NULL;
ALTER TABLE drip_tracking DROP COLUMN last_dividend_date;
ALTER TABLE drip_tracking RENAME COLUMN last_dividend_date_new TO last_dividend_date;

-- Migrate updated_at
ALTER TABLE drip_tracking ADD COLUMN updated_at_new INTEGER;
UPDATE drip_tracking SET updated_at_new = strftime('%s', updated_at) WHERE updated_at IS NOT NULL;
ALTER TABLE drip_tracking DROP COLUMN updated_at;
ALTER TABLE drip_tracking RENAME COLUMN updated_at_new TO updated_at;
