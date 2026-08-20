"""
Compile every per-security analysis summary into one document for the rater.

Reads the securities universe and the per-security *.summary.md files, wraps each
summary in symbol/name metadata, and emits the concatenated text plus bookkeeping
(the expected symbol list, the count, and the raw/validated ratings output paths).
Aborts if any expected summary is missing, since the portfolio is rated as a whole.

Environment: SENTINEL_TASKS_HOME (required).
Prints a one-line JSON object consumed by the rating loop.
"""

import json
import os
import pathlib
import re

data_dir = os.environ.get("SENTINEL_TASKS_HOME")
if not data_dir:
    raise SystemExit("SENTINEL_TASKS_HOME is required")
artifacts = pathlib.Path(data_dir) / "tasks" / "artifacts"
universe_root = artifacts / "refresh-securities-universe"
universe_path = universe_root / "securities-universe.json"
summary_dir = artifacts / "analyze-security"
output_dir = artifacts / "rate-portfolio"
ratings_raw_path = output_dir / "ratings.raw.json"
ratings_path = output_dir / "ratings.json"


def slug(value):
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", str(value)).strip("-") or "item"


if not universe_path.exists():
    raise SystemExit("Missing securities-universe.json")

universe = json.loads(universe_path.read_text(encoding="utf-8"))
if not isinstance(universe, list):
    raise SystemExit("securities-universe.json must contain an array")

sections = []
missing = []
expected_symbols = []
for entry in universe:
    if not isinstance(entry, dict):
        continue
    symbol = str(entry.get("symbol") or "").strip()
    name = str(entry.get("name") or "").strip()
    if not symbol:
        continue
    expected_symbols.append(symbol)

    summary_path = summary_dir / f"{slug(symbol)}.summary.md"
    if not summary_path.exists():
        missing.append(symbol)
        continue

    text = summary_path.read_text(encoding="utf-8").strip()
    if not text:
        missing.append(symbol)
        continue

    metadata = "\n".join(
        [
            "---",
            f"symbol: {json.dumps(symbol, ensure_ascii=False)}",
            f"name: {json.dumps(name, ensure_ascii=False)}",
            "---",
        ]
    )
    sections.append(f"{metadata}\n\n{text}")

if not sections:
    raise SystemExit("No security summaries found — run analyze-security for all securities first")

if missing:
    raise SystemExit(
        f"Missing summaries for {len(missing)} securities: {', '.join(missing[:10])}{'...' if len(missing) > 10 else ''}"
    )

compiled = "\n\n".join(sections)
output_dir.mkdir(parents=True, exist_ok=True)
for path in (ratings_raw_path, ratings_path):
    try:
        path.unlink()
    except FileNotFoundError:
        pass

print(
    json.dumps(
        {
            "compiledText": compiled,
            "count": len(sections),
            "missing": missing,
            "totalInUniverse": len(universe),
            "expectedSymbols": expected_symbols,
            "ratingsRawPath": str(ratings_raw_path),
            "ratingsPath": str(ratings_path),
        },
        ensure_ascii=False,
    )
)
