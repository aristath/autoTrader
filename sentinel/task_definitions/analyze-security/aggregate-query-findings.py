"""Concatenate every per-query findings file into one document for the distill prompt.
Environment: WORK_ROOT."""

import os
import pathlib

work_root = pathlib.Path(os.environ["WORK_ROOT"])
findings_dir = work_root / "query-findings"
chunks = []
if findings_dir.exists():
    for path in sorted(findings_dir.glob("*.md")):
        text = path.read_text(encoding="utf-8").strip()
        if text:
            chunks.append(text)
print("\n\n".join(chunks))
