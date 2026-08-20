"""
Submit each validated rating to Sentinel as a user preference, then persist the result.

POSTs symbol/user_multiplier/analysis to Sentinel for every rating, stopping at the first
failure (the run is then marked failed). On full success writes latest.json atomically.

Environment: RATINGS_JSON (the prepared ratings), SENTINEL_TASKS_HOME (output location),
             SENTINEL_BASE_URL (optional, default http://127.0.0.1:8000).
"""

import json
import os
import pathlib
import time
import urllib.error
import urllib.request

ratings_data = json.loads(os.environ["RATINGS_JSON"])
ratings = ratings_data.get("ratings", [])
if not ratings:
    raise SystemExit("No ratings to submit")

data_dir = os.environ.get("SENTINEL_TASKS_HOME")
if not data_dir:
    raise SystemExit("SENTINEL_TASKS_HOME is required")
output_dir = pathlib.Path(data_dir) / "tasks" / "artifacts" / "rate-portfolio"
base_url = str(os.environ.get("SENTINEL_BASE_URL", "http://127.0.0.1:8000")).rstrip("/")

submitted = []
failed = []

for r in ratings:
    symbol = r.get("symbol", "")
    rating = r.get("rating")
    rationale = r.get("rationale", "")

    if not symbol or rating is None:
        failed.append({"symbol": symbol, "error": "missing symbol or rating"})
        break

    payload = json.dumps(
        {
            "symbol": symbol,
            "user_multiplier": rating,
            "analysis": rationale,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        f"{base_url}/api/securities/preference",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            returned_symbol = str(body.get("symbol") or "").strip()
            if returned_symbol != symbol:
                raise RuntimeError(f"Sentinel returned {returned_symbol or 'no symbol'} after updating {symbol}")
            submitted.append({"symbol": symbol, "rating": rating, "sentinel": body})
    except urllib.error.HTTPError as e:
        try:
            err_text = e.read().decode("utf-8", errors="replace")
        except Exception:
            err_text = str(e)
        failed.append({"symbol": symbol, "error": f"HTTP {e.code}: {err_text[:200]}"})
        break
    except Exception as e:
        failed.append({"symbol": symbol, "error": str(e)[:200]})
        break

result = {
    "submitted": len(submitted),
    "failed": len(failed),
    "details": submitted,
    "failures": failed,
    "remaining": [str(item.get("symbol") or "") for item in ratings[len(submitted) + len(failed) :]],
    "ratings": ratings,
    "createdAt": int(time.time()),
}

if failed:
    print(json.dumps(result, ensure_ascii=False))
    raise SystemExit(f"Failed to submit {len(failed)} portfolio ratings")

output_dir.mkdir(parents=True, exist_ok=True)
tmp = output_dir / "latest.json.tmp"
tmp.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
tmp.replace(output_dir / "latest.json")

print(json.dumps(result, ensure_ascii=False))
