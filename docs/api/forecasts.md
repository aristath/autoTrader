# Forecasts

Base path: `/api/forecasts`

Forecast generation runs in an optional satellite service. These endpoints read
stored Sentinel results and report satellite health; they do not synchronously
generate a forecast. See [Forecasting](../forecasting.md).

## `GET /api/forecasts/status`

Returns:

| Field | Meaning |
|---|---|
| `enabled` | Whether scheduled forecasting is enabled |
| `service_url` | Configured satellite URL |
| `provider` | Configured provider |
| `model_id` | Configured model identifier/path |
| `latest_run` | Most recent persisted forecast run |
| `run_counts` | Persisted status counts |
| `service_health` | Satellite health response, when reachable |
| `service_error` | Connection/provider error, when unavailable |

An unavailable forecasting satellite is represented by `service_error`; it does
not make the main Sentinel API unavailable.

## `GET /api/forecasts/{symbol}`

Returns the latest stored combined forecast for one known security:

```json
{
  "symbol": "AIR.EU",
  "score": null,
  "scope_scores": {
    "solo": null,
    "grouped": null
  },
  "points": [],
  "evaluation": null
}
```

`score` is the combined planner-facing score. `scope_scores` exposes the latest
solo and grouped results, `points` contains the latest forecast path, and
`evaluation` summarizes realized accuracy. Unknown securities return 404.
