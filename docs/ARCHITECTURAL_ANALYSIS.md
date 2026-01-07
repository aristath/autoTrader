# Architectural Analysis & Refactoring Plan

**Last Updated**: 2025-01-27
**Purpose**: Comprehensive refactoring roadmap for production readiness, testability, debuggability, and extensibility

---

## Executive Summary

This document identifies **remaining architectural refactoring opportunities** to improve code organization, maintainability, and production readiness. The analysis focuses on structural improvements that will make the codebase easier to test, debug, and extend.

**Current Architecture Health**: 7.5/10

**Key Strengths**:
- ✅ Clean dependency injection architecture
- ✅ No circular dependencies
- ✅ Well-organized module structure (mostly)
- ✅ Comprehensive DI test coverage

**Key Areas for Improvement**:
- ⚠️ Inconsistent handler/routing patterns (14% standardized)
- ⚠️ Market regime code misplaced (in portfolio module)
- ⚠️ Database access lacks abstraction layer
- ⚠️ Repository pattern inconsistent
- ⚠️ Service boundaries unclear
- ⚠️ Error handling inconsistent
- ⚠️ Testing patterns need standardization

---

## 1. Handler/Routing Architecture Standardization

### Current State

**Problem**: Inconsistent routing patterns across modules

**Pattern 1**: Routes defined in `server.go` (15+ modules) - **NEEDS REFACTORING**
```go
// server.go - 15+ setup*Routes functions
func (s *Server) setupAllocationRoutes(r chi.Router) { ... }
func (s *Server) setupPortfolioRoutes(r chi.Router) { ... }
func (s *Server) setupUniverseRoutes(r chi.Router) { ... }
// ... 12+ more
```

**Pattern 2**: Routes in module with `RegisterRoutes()` (2 modules) - **GOOD EXAMPLE**
```go
// modules/symbolic_regression/handlers.go
func (h *Handlers) RegisterRoutes(r chi.Router) { ... }

// modules/rebalancing/handlers.go
func (h *Handlers) RegisterRoutes(r chi.Router) { ... }
```

**Pattern 3**: Handlers exist but no `RegisterRoutes()` (most modules)
```go
// modules/trading/handlers.go - Has handlers, no RegisterRoutes
// modules/allocation/handlers.go - Has handlers, no RegisterRoutes
// ... many more
```

### Issues

- ⚠️ Routing logic scattered across `server.go` (~840 lines)
- ⚠️ Hard to test routing in isolation
- ⚠️ Inconsistent patterns (only 2/15+ modules use RegisterRoutes)
- ⚠️ Some modules have handlers but not in `handlers/` subdirectory
- ⚠️ Server is doing too much (violates single responsibility)

### Refactoring Plan

#### 1.1 Standardize Handler Pattern

**Target Structure**:
```
modules/{module}/
├── handlers/
│   ├── handlers.go      # Handler struct and methods
│   └── routes.go        # RegisterRoutes function
├── service.go           # Business logic
└── models.go           # DTOs/request/response models
```

**Modules Needing Extraction** (13+ modules):
1. ⚠️ `allocation` - Extract from `setupAllocationRoutes()` (has handlers.go, needs routes.go)
2. ⚠️ `portfolio` - Extract from `setupPortfolioRoutes()` (has handlers.go, needs routes.go)
3. ⚠️ `universe` - Extract from `setupUniverseRoutes()` (has handlers.go, needs routes.go)
4. ⚠️ `trading` - Add `RegisterRoutes()` (handlers exist)
5. ⚠️ `dividends` - Extract from `setupDividendRoutes()` (has handlers.go, needs routes.go)
6. ⚠️ `display` - Extract from `setupDisplayRoutes()` (has handlers.go, needs routes.go)
7. ⚠️ `scoring` - Extract from `setupScoringRoutes()` (has api/handlers.go, needs routes.go)
8. ⚠️ `optimization` - Extract from `setupOptimizationRoutes()` (has handlers.go, needs routes.go)
9. ⚠️ `cash_flows` - Add `RegisterRoutes()` (handlers exist)
10. ⚠️ `charts` - Extract from `setupChartsRoutes()` (has handlers.go, needs routes.go)
11. ⚠️ `settings` - Extract from `setupSettingsRoutes()` (has handlers.go, needs routes.go)
12. ⚠️ `planning` - Add `RegisterRoutes()` (has handlers/ subdirectory)
13. ⚠️ `analytics` - Extract from `setupAnalyticsRoutes()` (new module)

**Implementation Steps**:
1. For each module, create `handlers/routes.go` with `RegisterRoutes()` function
2. Move routing logic from `server.go` to module's `routes.go`
3. Update `server.go` to call `module.RegisterRoutes(router)`
4. Ensure handlers are in `handlers/` subdirectory (move if needed)

**Benefits**:
- ✅ Consistent pattern across all modules
- ✅ Routing logic lives with module (better cohesion)
- ✅ Easier to test (can test routing in isolation)
- ✅ Server becomes thin router (~200 lines vs ~840 lines)
- ✅ Better separation of concerns

**Impact**: ⭐⭐⭐⭐ (High) - **PRIORITY 1**

#### 1.2 Simplify server.go

**Current**: ~840 lines with 15+ setup functions

**Target**: ~200 lines, just calls module `RegisterRoutes()`

**Example Target Structure**:
```go
func (s *Server) setupRoutes() {
    // System routes (handled separately)
    s.setupSystemRoutes(s.router)

    // Module routes - each module registers itself
    allocationHandlers := allocation.NewHandlers(s.container.AllocRepo, ...)
    allocationHandlers.RegisterRoutes(s.router)

    portfolioHandlers := portfolio.NewHandlers(s.container.PortfolioService, ...)
    portfolioHandlers.RegisterRoutes(s.router)

    // ... etc for all modules
}
```

**Impact**: ⭐⭐⭐ (Medium)

---

## 2. Market Regime Module Extraction

### Current State

**Problem**: Market regime detection code is in `modules/portfolio/` but it's a cross-cutting concern

**Files in Wrong Location**:
- `modules/portfolio/market_regime.go` - Core regime detection logic
- `modules/portfolio/regime_persistence.go` - Regime score persistence
- `modules/portfolio/market_index_service.go` - Market index data service

**Usage Across Codebase**:
- `modules/optimization/risk.go` - Uses regime for correlation matrices
- `modules/sequences/patterns/market_regime.go` - Uses regime for pattern generation
- `modules/symbolic_regression/regime_splitter.go` - Uses regime for formula splitting
- `internal/scheduler/adaptive_market_job.go` - Uses regime for adaptation
- Multiple other modules depend on regime

### Issues

- ⚠️ Market regime is a cross-cutting concern, not portfolio-specific
- ⚠️ Creates unnecessary coupling (other modules import portfolio just for regime)
- ⚠️ Violates single responsibility (portfolio module does too much)
- ⚠️ Hard to test regime logic in isolation

### Refactoring Plan

#### 2.1 Extract Market Regime Module

**Target Structure**:
```
internal/market_regime/
├── detector.go              # MarketRegimeDetector (from market_regime.go)
├── persistence.go           # RegimePersistence (from regime_persistence.go)
├── index_service.go         # MarketIndexService (from market_index_service.go)
├── models.go                # MarketRegimeScore and related types
├── interfaces.go            # RegimeDetector interface (if needed)
└── *_test.go               # Tests
```

**Implementation Steps**:
1. Create `internal/market_regime/` package
2. Move 3 files from `modules/portfolio/` to new package
3. Update package name from `portfolio` to `market_regime`
4. Update all imports across codebase:
   - `modules/optimization/risk.go`
   - `modules/sequences/patterns/market_regime.go`
   - `modules/symbolic_regression/regime_splitter.go`
   - `internal/scheduler/adaptive_market_job.go`
   - Any other files importing regime code
5. Update DI wiring in `internal/di/services.go` (if needed)
6. Run tests to ensure no regressions

**Benefits**:
- ✅ Clear separation of concerns
- ✅ Market regime is a standalone, reusable module
- ✅ Reduces coupling (modules don't need to import portfolio)
- ✅ Easier to test regime logic independently
- ✅ Better code organization

**Impact**: ⭐⭐⭐⭐ (High) - **PRIORITY 2**

---

## 3. Database Access Abstraction

### Current State

**Problem**: Raw database connections passed everywhere, no abstraction layer

**Current Pattern**:
```go
// Everywhere in codebase
positionRepo := portfolio.NewPositionRepository(
    portfolioDB.Conn(),  // Raw *sql.DB
    universeDB.Conn(),   // Raw *sql.DB
    log,
)
```

**Issues**:
- ⚠️ No abstraction layer (hard to mock for testing)
- ⚠️ Connection management scattered
- ⚠️ Limited transaction support (transactions exist but not consistently used)
- ⚠️ Direct access to `*sql.DB` everywhere
- ⚠️ Hard to add cross-cutting concerns (logging, metrics, retries)

### Refactoring Plan

#### 3.1 Add Transaction Helper

**Option A**: Add `WithTransaction` helper to `database.DB` (Recommended)

```go
// internal/database/db.go
func (db *DB) WithTransaction(ctx context.Context, fn func(*sql.Tx) error) error {
    tx, err := db.conn.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("failed to begin transaction: %w", err)
    }

    defer func() {
        if p := recover(); p != nil {
            _ = tx.Rollback()
            panic(p)
        } else if err != nil {
            _ = tx.Rollback()
        } else {
            err = tx.Commit()
        }
    }()

    return fn(tx)
}
```

**Usage**:
```go
err := portfolioDB.WithTransaction(ctx, func(tx *sql.Tx) error {
    // Multiple operations in transaction
    if err := repo.UpdatePosition(tx, ...); err != nil {
        return err
    }
    if err := repo.UpdateCash(tx, ...); err != nil {
        return err
    }
    return nil
})
```

**Benefits**:
- ✅ Consistent transaction handling
- ✅ Automatic rollback on error
- ✅ Panic-safe
- ✅ Easy to use

**Impact**: ⭐⭐⭐ (Medium)

#### 3.2 Repository Interface Standardization

**Current**: Some repositories have interfaces, some don't

**Target**: All repositories should have interfaces for testability

**Example**:
```go
// modules/portfolio/interfaces.go
type PositionRepositoryInterface interface {
    GetByISIN(ctx context.Context, isin string) (*domain.Position, error)
    Update(ctx context.Context, position *domain.Position) error
    // ... other methods
}

// modules/portfolio/position_repository.go
type PositionRepository struct {
    portfolioDB *sql.DB
    universeDB  *sql.DB
    log         zerolog.Logger
}

// Ensure it implements the interface
var _ PositionRepositoryInterface = (*PositionRepository)(nil)
```

**Benefits**:
- ✅ Easy to mock for testing
- ✅ Clear contracts
- ✅ Better testability

**Impact**: ⭐⭐⭐ (Medium)

---

## 4. Repository Pattern Standardization

### Current State

**Problem**: Inconsistent repository patterns

**Pattern 1**: `BaseRepository` exists but unused
```go
// database/repositories/base.go exists but not used
```

**Pattern 2**: Direct struct with `*sql.DB` (most repositories)
```go
type PositionRepository struct {
    portfolioDB *sql.DB
    universeDB  *sql.DB
    log         zerolog.Logger
}
```

**Pattern 3**: Some repositories have interfaces, some don't

### Issues

- ⚠️ `BaseRepository` exists but unused (dead code or missed opportunity?)
- ⚠️ No consistent pattern across repositories
- ⚠️ Hard to mock for testing (no interfaces)
- ⚠️ Inconsistent error handling

### Refactoring Plan

#### 4.1 Standardize Repository Pattern

**Standard**: All repositories should:
1. Have interface defined (for testability)
2. Accept `*sql.DB` or transaction in methods (for transaction support)
3. Use consistent error handling
4. Follow naming: `{Entity}Repository` and `{Entity}RepositoryInterface`

**Decision**: Either use `BaseRepository` consistently or remove it

**Recommendation**: Remove `BaseRepository` (it's not providing enough value) and standardize on:
- Interface for each repository
- Direct `*sql.DB` or `*sql.Tx` in methods
- Consistent error wrapping

**Impact**: ⭐⭐⭐ (Medium)

---

## 5. Service Layer Boundaries

### Current State

**Problem**: Unclear service boundaries

**Services in `internal/services/`**:
- `currency_exchange_service.go`
- `trade_execution_service.go`

**Services in modules**:
- `modules/*/service.go` (15+ services)

### Issues

- ⚠️ Unclear what goes where
- ⚠️ Some services are truly shared, some are domain-specific
- ⚠️ `trade_execution_service` is in `services/` but used by trading module

### Refactoring Plan

#### 5.1 Clarify Service Boundaries

**Rule**:
- **Module services** (`modules/*/service.go`): Business logic for specific domain
- **Shared services** (`internal/services/`): Infrastructure services used by multiple modules
- **Client services** (`internal/clients/`): External API clients

**Decision Needed**: Should `trade_execution_service` move to `modules/trading/`?

**Analysis**:
- `TradeExecutionService` is used by trading module and scheduler
- It's more of an infrastructure service (handles execution, safety checks)
- **Recommendation**: Keep in `internal/services/` (it's shared infrastructure)

**Impact**: ⭐⭐⭐ (Medium)

---

## 6. Error Handling Standardization

### Current State

**Problem**: Inconsistent error wrapping

**Examples**:
```go
// Good: Wrapped with context
return fmt.Errorf("failed to fetch security: %w", err)

// Bad: No context
return err

// Bad: String error
return fmt.Errorf("error occurred")
```

### Issues

- ⚠️ Some errors wrapped, some not
- ⚠️ Inconsistent error messages
- ⚠️ Some errors logged, some not
- ⚠️ No error categorization

### Refactoring Plan

#### 6.1 Standardize Error Wrapping

**Rule**: Always wrap errors with context using `fmt.Errorf("operation: %w", err)`

**Guidelines**:
- Always include operation context
- Preserve original error with `%w`
- Use consistent error message format: `"failed to {operation}: %w"`
- Log errors at service boundaries (not in repositories)

**Impact**: ⭐⭐⭐ (Medium)

#### 6.2 Error Categorization (Optional)

**Opportunity**: Define error types for different categories
```go
type DomainError struct {
    Code    string
    Message string
    Err     error
}

type ValidationError struct {
    Field   string
    Message string
}
```

**Impact**: ⭐⭐ (Low) - Nice to have, not critical

---

## 7. Testing Architecture Standardization

### Current State

**Problem**: Inconsistent testing patterns

**Good Examples**:
- `modules/trading/service_test.go` - Uses mocks
- `modules/universe/service_test.go` - Uses testify/mock

**Issues**:
- ⚠️ Some modules have tests, some don't
- ⚠️ Inconsistent mocking patterns
- ⚠️ Some tests use real DB, some use mocks
- ⚠️ No test utilities package

### Refactoring Plan

#### 7.1 Test Utilities Package

**Create**: `internal/testing/` package

**Contents**:
- Mock factories for common interfaces
- Test database helpers (in-memory SQLite)
- Common test utilities
- Test fixtures

**Example**:
```go
// internal/testing/mocks.go
func NewMockCashManager() *MockCashManager { ... }
func NewMockPortfolioService() *MockPortfolioService { ... }

// internal/testing/db.go
func NewTestDB() (*database.DB, error) { ... }
```

**Impact**: ⭐⭐⭐ (Medium)

#### 7.2 Standardize Test Patterns

**Rule**:
- **Unit tests**: Use mocks, no real DB
- **Integration tests**: Use test database (in-memory SQLite)
- **All tests**: Use testify for assertions
- **Test naming**: `Test{FunctionName}` or `Test{FunctionName}_{Scenario}`

**Impact**: ⭐⭐⭐ (Medium)

---

## 8. Type Safety Improvements

### Current State

**Problem**: Use of `interface{}` and `any` in some places

**Found**: 8+ instances of `interface{}` or `any`

**Examples**:
- `internal/scheduler/store_recommendations.go:14` - `plan interface{}`
- `internal/scheduler/planner_batch.go:142` - Event data `map[string]interface{}`

### Issues

- ⚠️ Loss of type safety
- ⚠️ Harder to refactor
- ⚠️ Runtime errors instead of compile-time

### Refactoring Plan

#### 8.1 Replace interface{} with Specific Types

**Rule**: Use explicit types, avoid `interface{}` when possible

**Examples**:
```go
// Before
type StoreRecommendationsJob struct {
    plan interface{}
}

// After
type StoreRecommendationsJob struct {
    plan *planning.Plan  // Or define Plan interface
}
```

**Impact**: ⭐⭐⭐ (Medium)

---

## 9. Module Structure Standardization

### Current State

**Problem**: Inconsistent module structure

**Good Examples**:
- `modules/quantum/` - Clean structure, well-organized
- `modules/symbolic_regression/` - Has `RegisterRoutes()`

**Issues**:
- ⚠️ Some modules have handlers in root, some in `handlers/` subdirectory
- ⚠️ Some modules have `domain/` subdirectory, some don't
- ⚠️ Inconsistent organization

### Refactoring Plan

#### 9.1 Standardize Module Structure

**Standard Template**:
```
modules/{module}/
├── domain/              # Domain models (if needed)
├── repository/         # Data access (if needed)
├── handlers/           # HTTP handlers (if module has API)
│   ├── handlers.go    # Handler struct and methods
│   └── routes.go      # RegisterRoutes function
├── service.go          # Business logic
├── models.go           # DTOs/request/response models
├── interfaces.go       # Module-specific interfaces (if needed)
└── *_test.go          # Tests
```

**Note**: Not all modules need all subdirectories. Use only what's needed.

**Impact**: ⭐⭐⭐ (Medium)

---

## 10. Configuration Management

### Current State

**Pattern**: Mixed configuration sources
- Environment variables (`.env` file)
- Settings database (`config.db`)
- Hard-coded defaults

### Issues

- ⚠️ Unclear precedence
- ⚠️ Deprecated `.env` for credentials but still used
- ⚠️ Configuration scattered

### Refactoring Plan

#### 10.1 Centralize Configuration (Low Priority)

**Opportunity**: Single configuration source with clear precedence

**Precedence** (highest to lowest):
1. Settings database (runtime config)
2. Environment variables (deployment config)
3. Hard-coded defaults

**Impact**: ⭐⭐ (Low) - Current system works, improvement is minor

---

## Refactoring Priority Matrix

### 🔄 High Priority (Next Steps)

1. **Handler Standardization** - **PRIORITY 1**
   - Extract `RegisterRoutes()` for 13+ modules
   - Move routing logic from `server.go` to modules
   - Simplifies server.go significantly
   - **Estimated**: 2-3 days

2. **Market Regime Extraction** - **PRIORITY 2**
   - Create `internal/market_regime/` package
   - Move 3 files from `portfolio/`
   - Update all imports
   - **Estimated**: 1-2 days

### Medium Priority

3. **Database Transaction Helper** - Add `WithTransaction` helper
4. **Repository Interface Standardization** - Add interfaces for all repositories
5. **Service Boundary Clarification** - Document and enforce boundaries
6. **Error Handling Standardization** - Consistent error wrapping
7. **Test Utilities Package** - Create `internal/testing/`
8. **Module Structure Standardization** - Consistent organization

### Low Priority

9. **Type Safety Improvements** - Replace `interface{}` with specific types
10. **Configuration Centralization** - Minor improvement

---

## Implementation Strategy

### Phase 1: Routing Standardization (Week 1)

**Goal**: Standardize handler pattern across all modules

**Steps**:
1. Create `handlers/routes.go` for each module
2. Move routing logic from `server.go` to modules
3. Update `server.go` to call `RegisterRoutes()`
4. Test each module's routing independently

**Success Criteria**:
- All modules have `RegisterRoutes()`
- `server.go` reduced to ~200 lines
- All routing tests pass

### Phase 2: Market Regime Extraction (Week 1-2)

**Goal**: Extract market regime to standalone module

**Steps**:
1. Create `internal/market_regime/` package
2. Move 3 files from `portfolio/`
3. Update all imports
4. Update DI wiring
5. Run full test suite

**Success Criteria**:
- Market regime code in new package
- All imports updated
- All tests pass
- No circular dependencies

### Phase 3: Database & Repository Improvements (Week 2-3)

**Goal**: Improve database access patterns

**Steps**:
1. Add `WithTransaction` helper
2. Add interfaces for all repositories
3. Standardize repository patterns
4. Update tests to use interfaces

**Success Criteria**:
- Transaction helper available
- All repositories have interfaces
- Tests use mocks

### Phase 4: Quality Improvements (Week 3-4)

**Goal**: Standardize error handling, testing, and module structure

**Steps**:
1. Create test utilities package
2. Standardize error handling
3. Standardize module structure
4. Improve type safety

**Success Criteria**:
- Consistent patterns across codebase
- Better testability
- Improved code quality

---

## Success Metrics

### Quantitative Metrics

- **Handler Standardization**: 0% → 100% (modules using `RegisterRoutes()`)
- **Server.go Size**: ~840 lines → ~200 lines (76% reduction)
- **Market Regime Extraction**: 0% → 100% (code moved to dedicated package)
- **Repository Interfaces**: ~50% → 100% (repositories with interfaces)
- **Test Coverage**: Current → +10% (with test utilities)

### Qualitative Metrics

- ✅ Consistent patterns across all modules
- ✅ Better separation of concerns
- ✅ Easier to test (mocking, isolation)
- ✅ Easier to debug (clear error messages, logging)
- ✅ Easier to extend (clear boundaries, interfaces)

---

## Notes

- This analysis focuses on **structural improvements**, not business logic
- Some refactoring may require breaking changes (acceptable per project philosophy)
- Prioritize refactoring that enables other improvements
- Test after each phase to ensure no regressions
- **Focus on handler standardization first** - it unlocks other improvements

---

## Appendix: Module Status

### Modules with RegisterRoutes() ✅
- `symbolic_regression`
- `rebalancing`

### Modules Needing RegisterRoutes() ⚠️
- `allocation`
- `portfolio`
- `universe`
- `trading`
- `dividends`
- `display`
- `scoring`
- `optimization`
- `cash_flows`
- `charts`
- `settings`
- `planning`
- `analytics`

### Market Regime Files to Move
- `modules/portfolio/market_regime.go` → `internal/market_regime/detector.go`
- `modules/portfolio/regime_persistence.go` → `internal/market_regime/persistence.go`
- `modules/portfolio/market_index_service.go` → `internal/market_regime/index_service.go`
