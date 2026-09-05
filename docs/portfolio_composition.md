# Portfolio composition and analytics

`sentinel/portfolio_composition.py` contains pure calculation helpers plus the
async `build_composition()` orchestrator used by
`GET /api/portfolio/composition`. There is no `PortfolioComposition` class and
no separate `/metrics` or `/radar` endpoint.

## Output

The endpoint returns:

| Field | Content |
|---|---|
| `as_of` | Calculation date |
| `total_value_eur` | Held-security value; cash is excluded from composition |
| `composition` | Current country, continent, industry, currency, and asset-class buckets |
| `composition_ideal` | Planner ideal weights rolled up by country and industry |
| `composition_post_plan` | Current holdings adjusted to recommendation target values, then rolled up |
| `metrics` | Return, risk, concentration, and home-market comparison |
| `home_markets` | Per-basket coverage, beta, and one-year excess return |
| `radar` | Six normalized 0..1 axes |

Buckets are arrays of `{ "name": ..., "pct": ... }` and use fractional
weights: `0.25` means 25 percent.

## Composition

`compose()` values current positions in EUR and groups them by security
metadata:

- country of risk;
- continent resolved from the ISO country code;
- industry;
- trading currency; and
- asset class derived from `instr_kind_c`.

Missing metadata falls into an explicit unknown bucket rather than changing the
total silently. `rollup_country_industry()` applies the same grouping to planner
weights or post-plan position values.

## Daily performance series

`build_daily_pnl()` combines snapshots with cumulative external deposits and
withdrawals. The module then derives:

- `daily_hprs()` for deposit-adjusted holding-period returns;
- `rolling_twr()` for one-year time-weighted return;
- `inception_cagr()` for the inception money-growth rate;
- `annualized_volatility()`;
- `max_drawdown()`; and
- `sharpe_ratio()` using the `risk_free_rate` setting.

Volatility, Sharpe, and beta use recent, outlier-filtered daily returns to limit
snapshot-reconstruction artifacts. The endpoint reads up to five years of
snapshots, while its one-year metrics use the recent window.

## Home-market comparison

Sentinel does not compare the entire global portfolio with one ETF. For each
holding, `resolve_benchmark_group()` chooses:

1. a national basket when a matching index is available;
2. a regional basket for the holding's continent; or
3. the union of available equity indices as a fallback.

`home_market_metrics()` calculates the security's beta and trailing excess
return against its basket, then value-weights covered holdings into
`beta_vs_home` and `alpha_1y_vs_home`. `home_coverage_pct` reports how much held
value had enough usable data. `home_markets` exposes the contributing groups.

## Concentration and radar

`hhi_concentration()` is the sum of squared positive position weights. A single
holding has HHI 1; equal distribution across more holdings approaches zero.
Cash is excluded.

`radar_axes()` maps these metrics to 0..1, where higher is better:

- one-year return;
- Sharpe ratio;
- home-market alpha;
- low volatility;
- low drawdown; and
- low concentration.

The normalization ranges are presentation heuristics, not additional
performance measurements.

## Failure behavior

Composition from current positions remains available if planner calculation
fails. In that case ideal and post-plan buckets are empty and the failure is
logged. Missing history produces neutral/zero metrics through the calculation
helpers.

## Tests

```bash
source .venv/bin/activate
pytest tests/test_portfolio_composition.py -v
```

See [Portfolio API](api/portfolio.md#get-apiportfoliocomposition) for the wire
contract.
