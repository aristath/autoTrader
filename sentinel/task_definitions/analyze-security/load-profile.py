"""Print profile.md for the query/distill prompts (aborts if empty).
Environment: WORK_ROOT."""

import os
import pathlib

path = pathlib.Path(os.environ["WORK_ROOT"]) / "profile.md"
profile = path.read_text(encoding="utf-8").strip() if path.exists() else ""
if not profile:
    raise SystemExit("profile is empty")
print(profile)
