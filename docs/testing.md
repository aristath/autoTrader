# Testing

Run checks from the repository root unless a section says otherwise. Activate
the Python environment first:

```bash
source .venv/bin/activate
```

## Backend

Run the complete suite:

```bash
pytest
```

Run a focused file or selection while developing:

```bash
pytest tests/test_database.py -v
pytest -k "test_settings" -v
```

Static checks:

```bash
ruff check .
ruff format --check .
pyright
```

A failing check is a failure; do not describe a change as verified while a
relevant suite remains red unless the failure is explicitly accepted and
recorded.

## Frontend

Run from `web/`:

```bash
npm ci
npm run build
```

There is currently no automated browser-test script in `web/package.json`.
Interactive frontend work therefore also requires a browser sweep against a
running API:

- load the complete page with no console exceptions or failed API requests;
- exercise every changed control, modal, tab, row expansion, and mutation;
- verify polling refreshes without destroying controls or authored children;
- test a narrow viewport (at least 320 CSS pixels) and a normal desktop width;
- confirm long tables, chart labels, boxes, and modal content wrap without
  horizontal page growth; and
- check both light and dark themes when visual behavior changed.

Do not treat a successful Vite build as proof that interactions work.

## Focused subsystem checks

Use the closest focused tests during development, then run the full suite before
release. Examples:

```bash
pytest tests/test_forecasting.py -v
pytest tests/jobs -v
pytest tests/test_strategy_contrarian.py -v
```

Use `rg --files tests` to find the current test filename; do not copy a command
for a test module that no longer exists.

## Documentation checks

After changing documentation:

```bash
python scripts/check_docs.py
```

The checker verifies local Markdown links, strict JSON examples in current
first-party docs, every configured setting, every fixed job in its required
indexes, and confirms that every public FastAPI `/api` operation has a
method/path heading in `docs/api/`. Generated TraderNet pages and explicitly
historical material are excluded from strict JSON validation because they
preserve source-era examples.

Also inspect the changed Markdown for meaning. Automated checks cannot detect a
plausible but obsolete command, response example, default, or architecture
description. Compare contracts with these source-of-truth locations:

| Contract | Source |
|---|---|
| API operations | FastAPI routes / generated `openapi.json` |
| Settings/defaults | `sentinel/settings.py` |
| Database schema | `sentinel/database/` |
| Fixed jobs | `sentinel/jobs/runner.py` |
| Editable tasks | `sentinel/task_definitions/` and task runtime |
| Frontend dependencies/scripts | `web/package.json` and `web/vite.config.js` |
| Production launch | `systemd/` and `scripts/deploy.sh` |

## Release verification

Local checks prove the candidate checkout. After deployment, verify the remote
revision, service, served frontend asset, and the real endpoints affected by the
change. See [Deployment](deployment.md#verification).
