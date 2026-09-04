# Go TUI

`TUI/` contains a separate terminal client built with Bubble Tea. It reads the
Sentinel HTTP API and does not run the backend or share the browser frontend.

## Run

Start Sentinel on port 8000, then from `TUI/`:

```bash
go run .
```

Available flags:

| Flag | Default | Purpose |
|---|---|---|
| `--api-url` | `http://localhost:8000` | Sentinel API base URL |
| `--settings-file` | `settings.json` | TUI JSON settings path |
| `--max-width` | `0` | Maximum columns; zero means no limit |
| `--max-height` | `0` | Maximum rows; zero means no limit |

Example:

```bash
go run . --api-url http://clara.local:8000 --max-width 120
```

## Settings file

The settings file contains:

```json
{
  "api_url": "http://localhost:8000"
}
```

If that file exists and contains a non-empty `api_url`, it takes precedence over
the `--api-url` flag. Use a different `--settings-file` or update the file when a
flag appears to have no effect.

## API use

The client currently reads:

- `GET /api/health`
- `GET /api/portfolio`
- `GET /api/portfolio/pnl-history?period=...`
- `GET /api/planner/recommendations`
- `GET /api/unified`

The TUI is a read-oriented client. Changes to these response contracts should be
validated against both the browser UI and this client.

## Build and test

From `TUI/`:

```bash
go test ./...
go build ./...
```
