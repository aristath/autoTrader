-- Migration script for portfolio.db
-- Converts all TEXT date/timestamp columns to INTEGER Unix timestamps
-- Run this script on the Arduino device: sqlite3 portfolio.db < migrate_portfolio_db.sql

-- ============================================================================
-- POSITIONS TABLE
-- ============================================================================
-- Migrate last_updated
ALTER TABLE positions ADD COLUMN last_updated_new INTEGER;
UPDATE positions SET last_updated_new = strftime('%s', last_updated) WHERE last_updated IS NOT NULL;
ALTER TABLE positions DROP COLUMN last_updated;
ALTER TABLE positions RENAME COLUMN last_updated_new TO last_updated;

-- Migrate first_bought (YYYY-MM-DD to Unix timestamp at midnight UTC)
ALTER TABLE positions ADD COLUMN first_bought_new INTEGER;
UPDATE positions SET first_bought_new = strftime('%s', first_bought || ' 00:00:00') WHERE first_bought IS NOT NULL;
ALTER TABLE positions DROP COLUMN first_bought;
ALTER TABLE positions RENAME COLUMN first_bought_new TO first_bought;

-- Migrate last_sold (YYYY-MM-DD to Unix timestamp at midnight UTC)
ALTER TABLE positions ADD COLUMN last_sold_new INTEGER;
UPDATE positions SET last_sold_new = strftime('%s', last_sold || ' 00:00:00') WHERE last_sold IS NOT NULL;
ALTER TABLE positions DROP COLUMN last_sold;
ALTER TABLE positions RENAME COLUMN last_sold_new TO last_sold;

-- ============================================================================
-- SCORES TABLE
-- ============================================================================
-- Migrate last_updated
ALTER TABLE scores ADD COLUMN last_updated_new INTEGER;
UPDATE scores SET last_updated_new = strftime('%s', last_updated) WHERE last_updated IS NOT NULL;
ALTER TABLE scores DROP COLUMN last_updated;
ALTER TABLE scores RENAME COLUMN last_updated_new TO last_updated;

-- ============================================================================
-- CASH_BALANCES TABLE
-- ============================================================================
-- Migrate last_updated
ALTER TABLE cash_balances ADD COLUMN last_updated_new INTEGER;
UPDATE cash_balances SET last_updated_new = strftime('%s', last_updated) WHERE last_updated IS NOT NULL;
ALTER TABLE cash_balances DROP COLUMN last_updated;
ALTER TABLE cash_balances RENAME COLUMN last_updated_new TO last_updated;
