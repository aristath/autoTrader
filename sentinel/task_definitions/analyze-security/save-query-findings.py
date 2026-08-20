"""Persist one query's extracted findings to its query-findings file.
Environment: FINDINGS, FINDINGS_PATH."""

import os
import pathlib

text = str(os.environ.get("FINDINGS") or "").strip()
findings_path = pathlib.Path(os.environ["FINDINGS_PATH"])
findings_path.parent.mkdir(parents=True, exist_ok=True)
tmp = findings_path.with_suffix(findings_path.suffix + ".tmp")
tmp.write_text((text + "\n") if text else "", encoding="utf-8")
tmp.replace(findings_path)
print("ok")
