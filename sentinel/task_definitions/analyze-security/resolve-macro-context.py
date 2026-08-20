"""Assemble the macro context for the summary prompt: for every macro bucket the
symbol belongs to, pull that bucket report's Findings section. Emits the symbol
fields, distilled findings, and a ready-to-inline macro-context prompt block.
Environment: ITEM_JSON, DISTILL_OUTPUT, SENTINEL_TASKS_HOME."""

import os
import json
import pathlib
import re

data_dir = os.environ.get("SENTINEL_TASKS_HOME")
if not data_dir:
    raise SystemExit("SENTINEL_TASKS_HOME is required")
artifacts = pathlib.Path(data_dir) / "tasks" / "artifacts"
buckets_root = artifacts / "refresh-macro-buckets"
macro_root = artifacts / "analyze-macro-bucket"
buckets_path = buckets_root / "macro-buckets.json"
item = json.loads(os.environ["ITEM_JSON"])
symbol = str(item.get("symbol") or "").strip()
name = str(item.get("name") or "").strip()
industry = str(item.get("industry") or "").strip()
geography = str(item.get("geography") or "").strip()
distilled = str(os.environ.get("DISTILL_OUTPUT") or "").strip()


def slug(value):
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", str(value)).strip("-") or "item"


macro_text = ""
if buckets_path.exists():
    buckets = json.loads(buckets_path.read_text(encoding="utf-8"))
    if isinstance(buckets, list):
        matched_buckets = []
        for bucket in buckets:
            if not isinstance(bucket, dict):
                continue
            symbols = bucket.get("symbols") or []
            if not isinstance(symbols, list):
                continue
            if symbol not in symbols:
                continue
            bucket_name = str(bucket.get("bucket") or "").strip()
            if not bucket_name:
                continue
            report_path = macro_root / f"{slug(bucket_name)}.md"
            if report_path.exists():
                report_text = report_path.read_text(encoding="utf-8").strip()
                # Extract just the findings section — skip sources and header
                findings_start = report_text.find("## Findings")
                if findings_start >= 0:
                    findings_text = report_text[findings_start:]
                else:
                    findings_text = report_text
                matched_buckets.append(
                    {
                        "bucket": bucket_name,
                        "findings": findings_text.strip(),
                    }
                )
        if matched_buckets:
            parts = []
            for mb in matched_buckets:
                parts.append(f"### {mb['bucket']}\n\n{mb['findings']}")
            macro_text = "\n\n".join(parts)

print(
    json.dumps(
        {
            "symbol": symbol,
            "name": name,
            "industry": industry,
            "geography": geography,
            "distilledFindings": distilled,
            "macroContextPrompt": "\nMacro context for this market segment:\n\n" + macro_text if macro_text else "",
            "hasMacro": bool(macro_text),
        },
        ensure_ascii=False,
    )
)
