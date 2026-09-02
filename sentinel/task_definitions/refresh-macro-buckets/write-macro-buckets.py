"""
Build the macro-bucket list from the current securities-universe snapshot.

Reads the securities universe produced by refresh-securities-universe, groups
every adequately-classified security into a "macro bucket" keyed by its
(country, industry) pair, and writes the sorted bucket list plus a companion
list of skipped securities (each with a reason). A bucket is the unit of work
for analyze-macro-bucket.

Environment:
  SENTINEL_TASKS_HOME (required) - Sentinel's task data root; both the input universe and the
                              output bucket files live beneath it.

Outputs (under <data>/tasks/artifacts/refresh-macro-buckets/):
  macro-buckets.json          - the sorted list of buckets with their members
  macro-buckets.skipped.json  - securities that could not be bucketed, with reasons

Prints one JSON line summarising counts and output paths.
"""

import json
import os
import pathlib

data_dir = os.environ.get("SENTINEL_TASKS_HOME")
if not data_dir:
    raise SystemExit("SENTINEL_TASKS_HOME is required")
artifacts = pathlib.Path(data_dir) / "tasks" / "artifacts"

# This task's own output directory, and the input snapshot from the universe task.
root = artifacts / "refresh-macro-buckets"
universe_path = artifacts / "refresh-securities-universe" / "securities-universe.json"
if not universe_path.exists():
    raise SystemExit("Missing securities universe. Run refresh-securities-universe first.")

universe = json.loads(universe_path.read_text(encoding="utf-8"))
if not isinstance(universe, list):
    raise SystemExit("securities-universe.json must contain an array")

# Group securities by (country_code, industry). Only securities carrying a symbol,
# name, industry, and a valid country geography are bucketed; everything else is
# recorded in `skipped` with the reason so coverage gaps stay auditable.
groups = {}
skipped = []
for raw in universe:
    if not isinstance(raw, dict):
        continue
    symbol = str(raw.get("symbol") or "").strip()
    name = str(raw.get("name") or "").strip()
    industry = str(raw.get("industry") or "").strip()
    geography = str(raw.get("geography") or "").strip()
    country_code = str(raw.get("country_code") or "").strip().upper()
    country_name = str(raw.get("country_name") or "").strip()

    # Reject incomplete records one criterion at a time, keeping a specific reason.
    if not symbol or not name:
        skipped.append({"symbol": symbol, "name": name, "reason": "missing symbol or name"})
        continue
    if not industry:
        skipped.append({"symbol": symbol, "name": name, "geography": geography, "reason": "missing industry"})
        continue
    if raw.get("geography_valid") is False or not country_code or not country_name:
        skipped.append(
            {
                "symbol": symbol,
                "name": name,
                "industry": industry,
                "geography": geography,
                "reason": "missing or non-country geography",
            }
        )
        continue

    # One bucket per (country, industry); accumulate members, de-duplicating symbols.
    key = (country_code, industry)
    bucket = f"{country_name} + {industry}"
    entry = groups.setdefault(
        key,
        {
            "bucket": bucket,
            "geography": country_code,
            "country_code": country_code,
            "country_name": country_name,
            "industry": industry,
            "symbols": [],
            "names": [],
        },
    )
    if symbol not in entry["symbols"]:
        entry["symbols"].append(symbol)
        entry["names"].append(name)

# Deterministic ordering: country, then industry, then the bucket label.
buckets = sorted(groups.values(), key=lambda item: (item["country_name"], item["industry"], item["bucket"]))

root.mkdir(parents=True, exist_ok=True)
(root / "macro-buckets.json").write_text(json.dumps(buckets, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(root / "macro-buckets.skipped.json").write_text(
    json.dumps(skipped, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)

print(
    json.dumps(
        {
            "path": str(root / "macro-buckets.json"),
            "count": len(buckets),
            "skipped": len(skipped),
            "skippedPath": str(root / "macro-buckets.skipped.json"),
        },
        ensure_ascii=False,
    )
)
