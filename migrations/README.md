# Database Migration Scripts

These migration scripts convert all TEXT date/timestamp columns to INTEGER Unix timestamps across all databases.

## Important Notes

- **These scripts are for running on the Arduino device only**
- **Do NOT commit these scripts to the repository** (they should be in .gitignore)
- **Backup your databases before running migrations**
- **Run migrations in order if dependencies exist**

## Migration Strategy

Each migration follows this pattern:
1. Add new INTEGER column with temporary suffix (e.g., `executed_at_new`)
2. Migrate data from old TEXT column to new INTEGER column using `strftime('%s', ...)`
3. Drop old TEXT column
4. Rename new column to the original name

## Running Migrations

### On Arduino Device

SSH into the device and run:

```bash
# Backup databases first!
cp ledger.db ledger.db.backup
cp history.db history.db.backup
cp portfolio.db portfolio.db.backup
cp config.db config.db.backup
cp agents.db agents.db.backup
cp cache.db cache.db.backup
cp universe.db universe.db.backup

# Run migrations
sqlite3 ledger.db < migrate_ledger_db.sql
sqlite3 history.db < migrate_history_db.sql
sqlite3 portfolio.db < migrate_portfolio_db.sql
sqlite3 config.db < migrate_config_db.sql
sqlite3 agents.db < migrate_agents_db.sql
sqlite3 cache.db < migrate_cache_db.sql
sqlite3 universe.db < migrate_universe_db.sql

# If discovered_formulas table exists in cache.db:
sqlite3 cache.db < migrate_cache_db_discovered_formulas.sql
```

### Verification

After running migrations, verify the schema:

```bash
sqlite3 ledger.db ".schema trades"
sqlite3 history.db ".schema daily_prices"
# etc.
```

All date/timestamp columns should now be INTEGER type.

## Date Format Handling

- **RFC3339 timestamps** (e.g., "2024-01-15T10:30:00Z"): Converted using `strftime('%s', timestamp)`
- **YYYY-MM-DD dates**: Converted using `strftime('%s', date || ' 00:00:00')` (midnight UTC)
- **Datetime strings** (e.g., "2024-01-15 10:30:00"): Converted using `strftime('%s', datetime_string)`

## Rollback

If you need to rollback, restore from backups:

```bash
cp ledger.db.backup ledger.db
# etc.
```

## Troubleshooting

- If a column doesn't exist, the migration will fail. Check the schema first.
- If data conversion fails, check the original data format.
- NULL values are preserved during migration.
