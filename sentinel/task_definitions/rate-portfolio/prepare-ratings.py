"""
Gate-check the validated ratings before submission.

Reads the validator result, aborts if it did not pass or produced no ratings, and otherwise
re-emits the ratings with a count for the submit step.

Environment: VALIDATION_JSON (the validator's JSON output).
"""

import json
import os

validation = json.loads(os.environ["VALIDATION_JSON"])
if not validation.get("ok"):
    errors = validation.get("errors") or ["ratings did not validate"]
    raise SystemExit("Portfolio rating output was invalid after repair attempts: " + "; ".join(map(str, errors[:20])))

ratings = validation.get("ratings", [])
if not ratings:
    raise SystemExit("No ratings to submit")

print(
    json.dumps(
        {
            "ratings": ratings,
            "count": len(ratings),
        },
        ensure_ascii=False,
    )
)
