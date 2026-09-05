# Forecasting

Sentinel's optional forecasting layer produces four-week probabilistic return
paths. It is provider-neutral at the database/API boundary; the current provider
implementation is Toto 2.0.

Forecasts adjust deterministic opportunity timing with a bounded configured
weight. They do not define strategic target weights and do not bypass a
`freefall_block`.

## Processes

The main Sentinel process contains:

- series preparation in `sentinel/forecasting/series.py`
- score conversion in `sentinel/forecasting/scoring.py`
- HTTP client in `sentinel/forecasting/client.py`
- `forecast:run` and `forecast:evaluate` fixed jobs
- `/api/forecasts` status and result APIs

Model inference runs in the separate FastAPI application
`sentinel.forecasting.service:app`, conventionally on port `8010`.

## Installation boundary

The main `pyproject.toml` does not define or install the Toto model stack. The
production service template intentionally uses `.venv-forecasting`. Provision
that environment with a compatible `toto2` package, its tensor runtime, and the
configured model files before enabling forecasting.

There is deliberately no `pip install '.[forecasting]'` command until the
repository defines and locks such an extra. Do not imply that the main lock file
reproduces the model environment.

Start a provisioned service from the repository root with:

```bash
.venv-forecasting/bin/python -m uvicorn sentinel.forecasting.service:app \
  --host 127.0.0.1 --port 8010
```

The included `systemd/sentinel-forecasting.service` shows the Clara production
model path and toolbox invocation.

## Service API

The separate forecasting service exposes:

- `GET /health` — provider/model defaults and readiness.
- `POST /forecast` — batched weekly series and masks, returning provider output.

These are not mounted under Sentinel's `/api` prefix. Sentinel's public status
and stored-result contract is [Forecast API](api/forecasts.md).

## Scheduled lifecycle

`forecast:run`:

1. Builds weekly series for eligible securities.
2. Requires configured minimum history and missing-data limits.
3. Generates solo and grouped forecasts, bounded by maximum group variates.
4. Stores run metadata and quantile points.
5. Converts forecast return/confidence/agreement into solo, grouped, and
   combined timing scores.

`forecast:evaluate` compares matured forecasts with actual returns and stores
absolute error and direction-hit results.

The planner ignores scores older than `forecasting_score_max_age_days`. A
service outage or absent score therefore degrades to deterministic opportunity
timing rather than blocking planning.

## Configuration

All forecast settings, defaults, and meanings are listed in
[Configuration](configuration.md#forecasting-settings). Important operational
controls are:

- `forecasting_enabled`
- `forecasting_service_url`
- `forecasting_model_id`
- `forecasting_request_timeout_seconds`
- `forecasting_score_max_age_days`
- `forecasting_timing_weight`

## Verification

```bash
curl --fail http://127.0.0.1:8010/health
curl --fail http://localhost:8000/api/forecasts/status
```

The Sentinel status endpoint reports service health/error separately from
stored run state. A reachable service alone does not prove a successful stored
forecast; inspect `latest_run`, `run_counts`, and a symbol result.

Run targeted tests with:

```bash
source .venv/bin/activate
pytest tests/test_forecasting.py -v
```
