"""Print profile-summaries.md for the profile prompt (aborts if empty).
Environment: WORK_ROOT."""

import os
import pathlib

path = pathlib.Path(os.environ["WORK_ROOT"]) / "profile-summaries.md"
content = path.read_text(encoding="utf-8") if path.exists() else ""
if not content.strip():
    raise SystemExit("profile summaries are empty")
print(content)
