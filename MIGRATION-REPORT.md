# Python to Go Migration - Remaining Work

**Updated:** 2026-01-03
**Status:** ~75% Complete (much better than initially estimated!)

---

## What's Left to Do

### Priority 1: Critical Jobs (2 files)

#### `app/jobs/event_based_trading.py` (714 lines)
- Main autonomous trading loop
- Monitors planning completion, executes trades
- **Complexity:** High (event-driven workflow)

#### `app/modules/planning/jobs/planner_batch.py` (619 lines)
- Incremental planning batch processor
- Self-triggering for continuation
- **Complexity:** High (state machine + planning integration)

### Priority 2: Job Enhancements (2 TODOs)

#### Sync Cycle Job - TODOs
- Portfolio sync from Tradernet (currently handled elsewhere)
- Negative balance check integration (requires RebalancingService wiring)

#### Dividend Reinvestment Job - TODOs
- Opportunities integration for low-yield dividends
- Trade execution (currently simulated)

### Priority 3: Services (3 files)

#### General Rebalancing Workflow
- `CalculateRebalanceTrades()` - planning integration
- `ExecuteRebalancing()` - orchestration
- **Note:** Emergency rebalancing is DONE (716 lines)

#### Trade Execution - Full Safety Validation
- Current: Simplified 176-line version
- Missing: 7-layer validation (frequency, market hours, cooldowns, etc.)
- **Note:** Methods exist in safety_service.go, need integration

#### Cash Flow Sync Orchestration
- Main `SyncFromTradernet()` is stub
- **Note:** DepositProcessor + DividendCreator are complete

### Priority 4: Smaller Jobs (4 files)

1. **Metrics Calculation** (400 lines) - Technical indicators (RSI, EMA, Bollinger, etc.)
2. **Securities Data Sync** - Exists as service, needs job wrapper
3. **Historical Data Sync** - Exists as service, needs job wrapper
4. **Maintenance Job** - Add backup/cleanup to existing health_check.go

### Priority 5: Can Stay Python

- `auto_deploy.py` - Deployment pipeline (300 lines)
- `pypfopt` microservice - Portfolio optimization
- `tradernet` microservice - Broker API gateway

---

## Recently Completed ✅

### Phase 1 (2026-01-03)
- ✅ Portfolio hash generation (389 lines) - **Critical blocker resolved**
- ✅ 6 jobs scheduled and running (health_check, sync_cycle, dividend_reinvestment, satellite_maintenance, satellite_reconciliation, satellite_evaluation)
- ✅ All 7 database repositories fully migrated (2,921 lines Go vs 2,062 Python)
- ✅ Trade frequency service (integrated into TradeRepository, 961 lines)
- ✅ Scoring orchestration (4,185 lines across 21 files)

---

## Quick Stats

**Remaining Python Files:** 196 (excluding __init__.py)
**Go Files:** 241
**Completion:** ~75%

**Biggest Remaining Work:**
1. Event-based trading job (714 lines)
2. Planner batch job (619 lines)
3. Trade execution full safety (integrate existing validation)
4. General rebalancing workflow (integrate with planning)
5. Metrics calculation job (400 lines)

**Estimated Effort:** ~4-6 weeks for critical items (P1-P3)
