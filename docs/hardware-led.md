# Arduino UNO Q LED application

The current deployed LED application is a soroban-style portfolio display for
an Arduino UNO Q and an 8x5 NeoPixel shield. It is an optional observer of
Sentinel; LED or bridge failure does not stop portfolio management.

Do not confuse this application with the separate experimental orbital-display
firmware under `firmware/orbital_display/`.

## Data flow

```text
Sentinel API
    │ HTTP
    ▼
UNO Q Linux app: arduino-app/sentinel/python/main.py
    │ Bridge.call("hm.u", payload)
    ▼
MCU sketch
    │
    ▼
8x5 NeoPixel soroban display
```

The Linux application reads:

- `GET /api/portfolio` for total EUR value and return percentage;
- `GET /api/planner/recommendations` for the recommendation indicator; and
- `GET /api/health` for broker connectivity.

It sends this four-integer bridge payload:

```text
[portfolio_value_eur, return_pct, has_recommendations, broker_connected]
```

Portfolio value is rounded and clamped to eight decimal digits. Return is
rounded and clamped to -99 through 99.

## Display

Columns 1 through 7 show soroban digits. The heaven bead is orange when the
digit is five or greater; earth beads are amber. Column 0 is reserved for
indicators:

| Indicator | Color |
|---|---|
| Broker disconnected | Red |
| Positive portfolio return | Green |
| Negative portfolio return | Red |
| Pending recommendations | Blue |

## API discovery

The application resolves the Sentinel base URL in this order:

1. `SENTINEL_API_URL`
2. `http://$HOST_IP:8000`
3. the container's detected default gateway on port 8000
4. `http://172.17.0.1:8000`

Set `SENTINEL_API_URL` explicitly when container networking does not match these
defaults.

## Runtime configuration

| Variable | Default | Meaning |
|---|---:|---|
| `LED_REFRESH_INTERVAL_SEC` | `60` | Seconds between portfolio pushes |
| `LED_BRIDGE_TIMEOUT_SEC` | `10` | Timeout for one bridge call |
| `LED_BRIDGE_RETRIES` | `3` | Attempts per scheduled push |
| `LED_BRIDGE_RETRY_DELAY_SEC` | `1` | Delay between attempts |
| `LED_MAX_CONSECUTIVE_FAILURES` | `5` | Failures before process exit |
| `LED_WATCHDOG_STALE_SEC` | `600` | Maximum age of the last successful bridge push |
| `LED_WATCHDOG_CHECK_INTERVAL_SEC` | `30` | Watchdog check interval |

Invalid integer values fall back to defaults. Values below their allowed
minimum are clamped.

## Health and recovery

After every bridge result, the application posts state to:

```text
POST /api/led/bridge/health
```

The report includes timestamps, the last error, consecutive failure count,
watchdog action, and app instance. Sentinel exposes the combined state through
the LED API documented in [API: LED](api/led.md).

If scheduled pushes repeatedly fail, or the last successful push becomes stale
and a watchdog ping also fails, the application exits intentionally. The UNO Q
application supervisor is expected to restart its container. This is recovery
behavior, not a signal to restart Sentinel itself.

## Files

| Path | Purpose |
|---|---|
| `arduino-app/sentinel/python/main.py` | Linux-side API polling, bridge calls, watchdog |
| `arduino-app/sentinel/sketch/sketch.ino` | MCU display implementation |
| `arduino-app/sentinel/app.yaml` | UNO Q application metadata/configuration |
| `sentinel/led/` | Sentinel-side enablement and bridge-health state |
