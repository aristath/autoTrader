"""Persist the final security summary as <slug>.summary.md (the file the picker and
rate-portfolio consume). Emits the path and word count.
Environment: ITEM_JSON, SUMMARY, SENTINEL_TASKS_HOME."""

import json
import os
import pathlib
import re

symbol = str(json.loads(os.environ["ITEM_JSON"]).get("symbol") or "").strip()
if not symbol:
    raise SystemExit("symbol is required")


def slug(value):
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", str(value)).strip("-") or "item"


data_dir = os.environ.get("SENTINEL_TASKS_HOME")
if not data_dir:
    raise SystemExit("SENTINEL_TASKS_HOME is required")
artifacts = pathlib.Path(data_dir) / "tasks" / "artifacts"
root = artifacts / "analyze-security"
root.mkdir(parents=True, exist_ok=True)

summary_path = root / f"{slug(symbol)}.summary.md"

raw = str(os.environ.get("SUMMARY") or "").strip()
if not raw:
    raise SystemExit("write-security-summary produced no output")

tmp = summary_path.with_suffix(summary_path.suffix + ".tmp")
tmp.write_text(raw + "\n", encoding="utf-8")
tmp.replace(summary_path)

print(
    json.dumps(
        {
            "summaryPath": str(summary_path),
            "wordCount": len(raw.split()),
        },
        ensure_ascii=False,
    )
)
