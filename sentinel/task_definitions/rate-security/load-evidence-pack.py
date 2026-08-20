"""
Print the evidence pack for the analysis prompt (aborts if it was not written).
Environment: CONTEXT_JSON (resolve-rating-context output).
"""

import os
import pathlib
import json

ctx = json.loads(os.environ["CONTEXT_JSON"])
path = pathlib.Path(ctx["evidencePackPath"])
if not path.exists():
    raise SystemExit("evidence pack was not written")
print(path.read_text(encoding="utf-8"))
