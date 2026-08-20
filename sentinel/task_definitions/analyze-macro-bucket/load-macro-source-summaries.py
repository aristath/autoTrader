"""
Print the accumulated source summaries for the findings prompt.

Reads macro-source-summaries.md and writes it to stdout; aborts if it is empty.

Environment: WORK_ROOT (scratch dir).
"""

import os
import pathlib

path = pathlib.Path(os.environ["WORK_ROOT"]) / "macro-source-summaries.md"
content = path.read_text(encoding="utf-8") if path.exists() else ""
if not content.strip():
    raise SystemExit("No macro source summaries were saved")
print(content)
