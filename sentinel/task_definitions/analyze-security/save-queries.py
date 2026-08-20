"""Read queries.json (written by the queries prompt), clean each query string, and
emit the usable queries as a JSON array. Aborts if none are usable.
Environment: QUERIES_PATH."""

import os
import json
import pathlib
import re

queries_path = pathlib.Path(os.environ["QUERIES_PATH"])
if not queries_path.exists():
    raise SystemExit("generate-queries did not write queries.json")

raw = json.loads(queries_path.read_text(encoding="utf-8"))
if not isinstance(raw, list):
    raise SystemExit("queries.json must contain a JSON array")


def clean(query):
    text = re.sub(r"^\s*(?:[-*]\s+|\d{1,2}[.)]\s+)", "", str(query or "")).strip()
    return " ".join(text.split()).strip()


queries = [clean(item) for item in raw if isinstance(item, str) and clean(item)]
if not queries:
    raise SystemExit("queries.json did not contain any usable query strings")

print(json.dumps(queries, ensure_ascii=False))
