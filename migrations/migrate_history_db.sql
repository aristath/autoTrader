-- Migration script for history.db
-- Converts all TEXT date columns to INTEGER Unix timestamps
-- Run this script on the Arduino device: sqlite3 history.db < migrate_history_db.sql

-- ============================================================================
-- DAILY_PRICES TABLE
-- ============================================================================
-- Migrate date (YYYY-MM-DD to Unix timestamp at midnight UTC)
ALTER TABLE daily_prices ADD COLUMN date_new INTEGER;
UPDATE daily_prices SET date_new = strftime('%s', date || ' 00:00:00') WHERE date IS NOT NULL;
ALTER TABLE daily_prices DROP COLUMN date;
ALTER TABLE daily_prices RENAME COLUMN date_new TO date;

-- ============================================================================
-- EXCHANGE_RATES TABLE
-- ============================================================================
-- Migrate date (YYYY-MM-DD to Unix timestamp at midnight UTC)
ALTER TABLE exchange_rates ADD COLUMN date_new INTEGER;
UPDATE exchange_rates SET date_new = strftime('%s', date || ' 00:00:00') WHERE date IS NOT NULL;
ALTER TABLE exchange_rates DROP COLUMN date;
ALTER TABLE exchange_rates RENAME COLUMN date_new TO date;

-- ============================================================================
-- MONTHLY_PRICES TABLE
-- ============================================================================
-- Note: year_month stays as TEXT (YYYY-MM format)
-- Migrate created_at
ALTER TABLE monthly_prices ADD COLUMN created_at_new INTEGER;
UPDATE monthly_prices SET created_at_new = strftime('%s', created_at) WHERE created_at IS NOT NULL;
ALTER TABLE monthly_prices DROP COLUMN created_at;
ALTER TABLE monthly_prices RENAME COLUMN created_at_new TO created_at;
