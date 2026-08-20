"""
Resolve the requested macro bucket and prepare its scratch + report paths.

Looks up the manual `bucket` input in macro-buckets.json (by exact name or slug),
recreates a clean per-bucket .work scratch dir (guarded to stay under this task's
artifacts), and emits the selected bucket augmented with workRoot/reportPath as a
single-element JSON array (the unit the research pipeline iterates).

Environment: BUCKET (the requested bucket), SENTINEL_TASKS_HOME.
"""

import json
import os
import pathlib
import re
import shutil

requested = str(os.environ.get("BUCKET") or "").strip()
if not requested:
    raise SystemExit('Manual input "bucket" is required')

data_dir = os.environ.get("SENTINEL_TASKS_HOME")
if not data_dir:
    raise SystemExit("SENTINEL_TASKS_HOME is required")
artifacts = pathlib.Path(data_dir) / "tasks" / "artifacts"
root = artifacts / "analyze-macro-bucket"
buckets_path = artifacts / "refresh-macro-buckets" / "macro-buckets.json"
if not buckets_path.exists():
    raise SystemExit("Missing macro-buckets.json. Run refresh-macro-buckets first.")


def slug(value):
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", str(value)).strip("-") or "item"


buckets = json.loads(buckets_path.read_text(encoding="utf-8"))
if not isinstance(buckets, list):
    raise SystemExit("macro-buckets.json must contain an array")

requested_slug = slug(requested)
selected = None
for bucket in buckets:
    if not isinstance(bucket, dict):
        continue
    bucket_name = str(bucket.get("bucket") or "").strip()
    if bucket_name == requested or slug(bucket_name) == requested_slug:
        selected = dict(bucket)
        break
if selected is None:
    raise SystemExit(f'Macro bucket "{requested}" not found in macro-buckets.json')

bucket_name = str(selected.get("bucket") or "").strip()
work_root = root / ".work" / slug(bucket_name)
case_root = str(work_root)
home = pathlib.Path.home()
expected_prefix = str(home / ".sentinel" / "tasks" / "artifacts" / "analyze-macro-bucket")
if not case_root.startswith(expected_prefix):
    raise SystemExit(f"Refusing to clean unexpected scratchpad path: {case_root}")
shutil.rmtree(work_root, ignore_errors=True)
work_root.mkdir(parents=True, exist_ok=True)
root.mkdir(parents=True, exist_ok=True)

selected["workRoot"] = str(work_root)
selected["reportPath"] = str(root / f"{slug(bucket_name)}.md")
print(json.dumps([selected], ensure_ascii=False))
