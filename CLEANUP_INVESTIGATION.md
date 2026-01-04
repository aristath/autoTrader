# Cleanup Investigation Report
**Date:** 2026-01-04
**Purpose:** Identify remaining cleanup opportunities after multi-bucket/satellite removal

## Summary

After removing multi-bucket, multi-agent, and satellite functionality, several cleanup items remain:

## Findings

### 1. ✅ AgentsDB is Still Needed (Valid Usage)

**Status:** **KEEP** - AgentsDB is still used and necessary

**Usage:**
- `PlannerRepository` stores sequences, evaluations, and best_result tables
- Used by incremental planner for batch generation and evaluation tracking
- Used by planning handlers for status queries and execution tracking

**Tables in agents.db that are still needed:**
- ✅ `sequences` - Trade action sequences for planning
- ✅ `evaluations` - Sequence evaluation results
- ✅ `best_result` - Best sequence per portfolio state

**Tables that should be removed (no longer used):**
- ❌ `agent_configs` - Was for multi-agent TOML configs (now in config.db as planner_settings)
- ❌ `config_history` - Was for agent config versioning (no longer needed)

### 2. ❌ Migration 007 - Satellites Update (OBSOLETE)

**File:** `trader/internal/database/migrations/007_satellites_update.sql`

**Status:** **SHOULD BE REMOVED** or marked obsolete

**Issues:**
- Adds `agent_id` column to `buckets` table
- References satellites.db which no longer exists
- Entire migration is obsolete since satellites/buckets are removed

**Action:** Mark as obsolete or remove (but keep for historical reference)

### 3. ❌ Migration 005 - Agent Configs (PARTIALLY OBSOLETE)

**File:** `trader/internal/database/migrations/005_agents_schema.sql`

**Status:** **NEEDS CLEANUP**

**Issues:**
- Creates `agent_configs` table with `bucket_id` column (no longer needed)
- Creates `config_history` table (no longer needed)
- Creates `sequences`, `evaluations`, `best_result` tables (still needed)

**Action:**
- Migration should be split or cleaned up
- Remove `agent_configs` and `config_history` table creation
- Keep sequences, evaluations, best_result table creation
- Remove `bucket_id` references from comments

### 4. ❌ Migration Scripts (OBSOLETE)

**Files:**
- `trader/scripts/migration/migrate_bucket_balances_to_positions.go`
- `trader/scripts/migration/README.md` (references satellites.db)

**Status:** **SHOULD BE MARKED OBSOLETE**

**Issues:**
- Migration scripts reference satellites.db which no longer exists
- Scripts are for migrating bucket_balances which no longer exist

**Action:** Mark as obsolete or remove

### 5. ❌ Documentation References

**Files:**
- `README.md` - References satellites in architecture diagram
- `DATABASE_MIGRATION_STATUS.md` - References satellites.db
- `MIGRATION_AUDIT.md` - References satellites/buckets
- `trader/scripts/migration/README.md` - References satellites.db

**Status:** **NEEDS UPDATING**

**Action:** Update documentation to reflect single-portfolio architecture

### 6. ✅ PlannerRepository (VALID)

**Status:** **KEEP** - Still needed for planning functionality

**Usage:**
- Stores sequences and evaluations for batch planning
- Used by incremental planner
- Used by planning handlers

**No changes needed** - This is legitimate usage of agents.db

## Recommended Actions

### Priority 1: Clean Up Database Schema

1. **Remove/Mark Migration 007**
   - Migration 007 adds agent_id to buckets table
   - Satellites/buckets are removed, so this is obsolete
   - Action: Mark as obsolete or remove

2. **Clean Up Migration 005**
   - Remove agent_configs table creation (no longer used)
   - Remove config_history table creation (no longer used)
   - Remove bucket_id references from comments
   - Keep sequences, evaluations, best_result tables (still needed)

3. **Create New Migration (if needed)**
   - Migration to drop agent_configs table if it exists
   - Migration to drop config_history table if it exists
   - Migration to drop bucket_id index if it exists

### Priority 2: Update Documentation

1. **Update README.md**
   - Remove references to satellites in architecture diagram
   - Update database architecture description
   - Remove multi-bucket/multi-agent references

2. **Update Migration Docs**
   - Remove references to satellites.db
   - Update database count from 8 to 7 (satellites removed)
   - Update migration scripts documentation

### Priority 3: Mark Obsolete Scripts

1. **Migration Scripts**
   - Mark migrate_bucket_balances_to_positions.go as obsolete
   - Update migration README to note obsolete scripts

## Notes

- **AgentsDB is still needed** - Don't remove it
- **PlannerRepository is valid** - It stores sequences/evaluations for single planner
- **Only agent_configs/config_history need removal** - Not the entire agents.db
