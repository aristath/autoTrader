"""Validate and persist the freshly generated profile (profile.md + sidecar JSON).
Environment: PROFILE, ITEM_JSON."""

import os
import json
import pathlib
import time

profile = str(os.environ.get("PROFILE") or "").strip()
if not profile:
    raise SystemExit("generate-profile produced no output")
lowered = profile.lower()
bad_fragments = [
    "(no profile available)",
    "cannot write a factual profile",
    "does not mention",
    "does not provide any details",
    "no usable profile sources",
]
if any(fragment in lowered for fragment in bad_fragments):
    raise SystemExit("generated profile is not usable")

item = json.loads(os.environ["ITEM_JSON"])
work_root = pathlib.Path(item["workRoot"])
sidecar_path = pathlib.Path(item["profileSidecarPath"])
index_path = work_root / "profile-index.json"
try:
    sources = json.loads(index_path.read_text(encoding="utf-8"))
except Exception:
    sources = []
if not isinstance(sources, list) or not sources:
    raise SystemExit("profile-index.json has no profile sources")

path = work_root / "profile.md"
path.write_text(profile + "\n", encoding="utf-8")
payload = {
    "version": 1,
    "symbol": item.get("symbol"),
    "name": item.get("name"),
    "profile": profile,
    "sources": sources,
    "source": "fresh-profile-run",
    "createdAt": int(time.time()),
}
sidecar_path.parent.mkdir(parents=True, exist_ok=True)
tmp = sidecar_path.with_suffix(sidecar_path.suffix + ".tmp")
tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
tmp.replace(sidecar_path)
print("generated profile saved")
