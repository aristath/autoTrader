"""Central data directory configuration."""

import os
from pathlib import Path

# Project root is the parent of the sentinel package directory
_PROJECT_ROOT = Path(__file__).parent.parent

SENTINEL_HOME = Path(os.environ.get("SENTINEL_HOME", Path.home() / ".sentinel"))
TASKS_DIR = SENTINEL_HOME / "tasks"
TASK_ARTIFACTS_DIR = TASKS_DIR / "artifacts"

DATA_DIR = Path(os.environ.get("SENTINEL_DATA_DIR", _PROJECT_ROOT / "data"))
