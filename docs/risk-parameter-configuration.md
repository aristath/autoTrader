# Risk Parameter Configuration

## Overview

The trading system now supports **per-agent risk parameter configuration**, enabling the multi-agent architecture where different satellites can have different risk assessment criteria.

## What Changed

Previously, risk metrics (Sharpe Ratio, Sortino Ratio) used hardcoded values:
- Risk-free rate: `0.0%` (incorrect for current markets)
- Sortino MAR: `0.0%` (too low for retirement portfolios)

Now, each agent can configure:
- **Risk-Free Rate**: Annual risk-free rate (e.g., T-Bill rate)
- **Sortino MAR**: Minimum Acceptable Return for downside risk assessment
- **Evaluation Period**: Days for performance evaluation window
- **Volatility Window**: Days for volatility calculation

## Default Values

### Main/Core Portfolio
Retirement-focused defaults:
```go
RiskFreeRate:         0.035  // 3.5% annual
SortinoMAR:           0.05   // 5% (inflation + modest real return)
EvaluationPeriodDays: 90     // Quarterly evaluation
VolatilityWindow:     60     // 60-day volatility
```

### Satellite Presets

| Preset | Strategy | Risk-Free | Sortino MAR | Eval Period | Vol Window |
|--------|----------|-----------|-------------|-------------|------------|
| **momentum_hunter** | Aggressive | 3.5% | **9%** | 60 days | 30 days |
| **steady_eddy** | Conservative | 3.5% | **5%** | 120 days | 90 days |
| **dip_buyer** | Moderate-Aggressive | 3.5% | **7%** | 90 days | 60 days |
| **dividend_catcher** | Conservative | 3.5% | **5%** | 120 days | 90 days |

**Rationale:**
- **Aggressive satellites** (momentum_hunter): Higher MAR (9%) reflects higher return expectations, shorter evaluation (60 days) reacts faster to performance changes
- **Conservative satellites** (steady_eddy, dividend_catcher): Lower MAR (5%), longer evaluation (120 days) provides patient, stable assessment
- **Risk-free rate** (3.5%): Market constant, same across all agents

## Financial Significance

### Sortino Ratio Improvement

The Sortino Ratio now properly distinguishes between:
- **Good volatility**: Upside returns (not penalized)
- **Bad volatility**: Returns below MAR (penalized)

This is **critical for retirement portfolios** where we care about downside protection, not limiting upside.

**Example:**
- Portfolio return: 12%
- Sortino with 0% MAR: Counts all negative days as "bad"
- Sortino with 5% MAR: Only counts days below 5% as "bad"

The 5% MAR better reflects retirement needs (beat inflation + modest real return).

### Risk-Free Rate Impact

Using 3.5% instead of 0% for risk-free rate:
- **More accurate Sharpe Ratio**: Measures excess return over risk-free alternative
- **Conservative risk assessment**: Don't overstate risk-adjusted returns
- **Market realistic**: Reflects actual T-Bill / SOFR rates

**Impact on Sharpe:**
```
Portfolio: 10% return, 15% volatility
Sharpe (0% RFR):   0.67
Sharpe (3.5% RFR): 0.43  ← More conservative, more accurate
```

## How to Configure

### Per-Satellite Configuration

Satellites automatically get preset defaults when created, but can be customized:

```go
// Load satellite settings
settings, err := bucketService.GetSettings(satelliteID)

// Customize risk parameters
settings.RiskFreeRate = 0.04          // 4% if T-Bill rates rise
settings.SortinoMAR = 0.08            // 8% for more aggressive satellite
settings.EvaluationPeriodDays = 45    // Faster rebalancing

// Save
_, err = bucketService.SaveSettings(settings)
```

### Slider-Based Dynamic Calculation

Risk parameters can also be derived from the `RiskAppetite` slider (0.0 - 1.0):

```go
riskFreeRate, sortinoMAR, evalDays, volWindow :=
    CalculateRiskParamsFromSliders(settings)

// RiskAppetite = 0.0 (conservative):
//   Sortino MAR: 5%, Eval: 120 days, Vol: 90 days
//
// RiskAppetite = 0.5 (moderate):
//   Sortino MAR: 7%, Eval: 90 days, Vol: 60 days
//
// RiskAppetite = 1.0 (aggressive):
//   Sortino MAR: 9%, Eval: 60 days, Vol: 30 days
```

## Database Schema

### satellite_settings Table

```sql
CREATE TABLE satellite_settings (
    satellite_id TEXT PRIMARY KEY,
    preset TEXT,
    risk_appetite REAL DEFAULT 0.5,
    -- ... other strategy sliders ...

    -- New risk metric parameters:
    risk_free_rate REAL DEFAULT 0.035,
    sortino_mar REAL DEFAULT 0.05,
    evaluation_period_days INTEGER DEFAULT 90,
    volatility_window INTEGER DEFAULT 60,

    FOREIGN KEY (satellite_id) REFERENCES buckets(id)
);
```

### allocation_settings Table

Global defaults for fallback:

```sql
INSERT INTO allocation_settings VALUES
    ('default_risk_free_rate', 0.035, 'Default annual risk-free rate'),
    ('default_sortino_mar', 0.05, 'Default Sortino MAR'),
    ('default_evaluation_days', 90, 'Default evaluation period');
```

## Migration for Existing Databases

For existing installations, run the migration script:

```bash
sqlite3 trader.db < scripts/migrations/001_add_risk_parameters.sql
```

This will:
1. Add new columns to `satellite_settings` with sensible defaults
2. Add global defaults to `allocation_settings`
3. Update schema version to 2

**No data loss**: Existing satellites will automatically get default values (3.5% RFR, 5% MAR, 90-day eval).

## Code References

### Core Formula Changes
- **`pkg/formulas/sharpe.go`**: Sortino Ratio now accepts `targetReturn` (MAR) as separate parameter
- **`internal/modules/satellites/models.go`**: `SatelliteSettings` struct extended with risk parameters
- **`internal/modules/portfolio/models.go`**: `RiskParameters` struct for main portfolio

### Parameterization Points
- **`satellites/performance_metrics.go`**: `CalculateBucketPerformance()` uses satellite settings
- **`satellites/meta_allocator.go`**: Loads per-satellite settings for performance evaluation
- **`portfolio/service.go`**: Uses `RiskParameters` for main portfolio analytics

### Preset Defaults
- **`satellites/parameter_mapper.go`**:
  - `GetDefaultRiskParamsForPreset()` - Maps preset → risk parameters
  - `CalculateRiskParamsFromSliders()` - Derives from RiskAppetite slider

## Best Practices

1. **Don't lower MAR below inflation**: 5% minimum recommended for retirement
2. **Keep risk-free rate current**: Update as T-Bill rates change
3. **Aggressive satellites need higher MAR**: 9% for momentum strategies
4. **Longer evaluation for stable strategies**: 120 days for dividend catchers
5. **Shorter volatility window for reactive strategies**: 30 days for momentum hunters

## Future Enhancements

Potential additions (not yet implemented):
- **VaR / CVaR**: Tail risk metrics for downside protection
- **Sector concentration limits**: Geographic/industry diversification metrics
- **Rolling period returns**: Sequence of returns risk for retirement
- **Time-weighted vs Money-weighted returns**: Account for monthly deposits
- **Dynamic risk-free rate**: Fetch from Fed API daily

## Questions?

See the plan file: `/Users/aristath/.claude/plans/buzzing-finding-pillow.md`

Or review the migration discussion in the conversation history.
