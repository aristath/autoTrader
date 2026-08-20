"""Build the canonical security report (profile + sources + findings) atomically,
then store one mem0 memory per finding (citation markers stripped, inline URLs kept).
Report is written before mem0 so the artifact always survives.
Environment: ITEM_JSON, DISTILL_OUTPUT, PROFILE, SENTINEL_BASE_URL (optional)."""

import os
import datetime as dt
import json
import pathlib
import re
import urllib.error
import urllib.request

item = json.loads(os.environ["ITEM_JSON"])
symbol = item.get("symbol")
name = item.get("name")
industry = item.get("industry")
geography = item.get("geography")
work_root = pathlib.Path(item["workRoot"])
report_path = pathlib.Path(item["reportPath"])

raw = os.environ.get("DISTILL_OUTPUT", "")
if not isinstance(raw, str) or not raw.strip():
    raise SystemExit("distill-security-findings produced no output")

profile_text = str(os.environ.get("PROFILE") or "").strip()

CITE_PATTERN = re.compile(r"\[(\d+(?:\s*,\s*\d+)*)\]")
URL_PATTERN = re.compile(r"https?://[^\s)\]]+")


def extract_bullets(text):
    bullets = []
    for line in text.splitlines():
        m = re.match(r"^\s*[-*]\s+(.*\S)\s*$", line)
        if not m:
            continue
        body = m.group(1).strip()
        if body.lower() in {"none.", "none", "no findings.", "no findings"}:
            continue
        bullets.append(body)
    return bullets


def collect_inline_urls(bullet):
    seen, ordered = set(), []
    for match in URL_PATTERN.finditer(bullet):
        url = match.group(0).rstrip(".,;:!?")
        if url and url not in seen:
            seen.add(url)
            ordered.append(url)
    return ordered


def memory_text(bullet):
    # Strip numeric [N] citations — they only resolve against the run's
    # source pools and are meaningless once a bullet is sitting in mem0.
    # Inline URLs are self-describing and stay in the text.
    text = CITE_PATTERN.sub("", bullet)
    text = re.sub(r"\s+([.,;:!?])", r"\1", text)
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text


def store_memory(item):
    request = urllib.request.Request(
        os.environ.get("SENTINEL_BASE_URL", "http://127.0.0.1:8000") + "/api/memory/dedup-store",
        data=json.dumps(
            {
                "memory": item["memory"],
                "tags": item["tags"],
                "metadata": item["metadata"],
            }
        ).encode("utf-8"),
        headers={"content-type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            response.read()
            return True, None
    except urllib.error.HTTPError as error:
        return False, (error.read().decode("utf-8", errors="replace") or str(error))
    except Exception as error:
        return False, str(error)


# Merge every URL the pipeline fetched into a single Sources block —
# profile sources first, then each query batch in deterministic order.
sources = []
seen_urls = set()


def add_source(url, title):
    url = (url or "").strip()
    if not url or url in seen_urls:
        return
    seen_urls.add(url)
    sources.append({"url": url, "title": (title or "").strip()})


profile_index_path = work_root / "profile-index.json"
if profile_index_path.exists():
    for entry in json.loads(profile_index_path.read_text(encoding="utf-8")):
        if isinstance(entry, dict):
            add_source(entry.get("url"), entry.get("title"))

query_index_dir = work_root / "query-source-index"
if query_index_dir.exists():
    for path in sorted(query_index_dir.glob("*.json")):
        for entry in json.loads(path.read_text(encoding="utf-8")):
            if isinstance(entry, dict):
                add_source(entry.get("url"), entry.get("title"))

bullets = extract_bullets(raw)
today = dt.date.today().isoformat()

memory_items = []
for bullet in bullets:
    text = memory_text(bullet)
    if not text:
        continue
    inline_urls = collect_inline_urls(bullet)
    tags = []
    for value in ["securities", symbol, "query-source-summary", geography, industry]:
        if value and value not in tags:
            tags.append(value)
    metadata = {
        "domain": "securities",
        "primary_sector": "securities",
        "as_of": today,
        "symbol": symbol,
        "kind": "query-source-summary",
        "industry": industry,
        "geography": geography,
        "source_urls": inline_urls,
    }
    memory_items.append({"memory": text, "tags": tags, "metadata": metadata})

# Build the canonical report. Write before mem0 stores so the artifact is
# always on disk even if every mem0 write fails.
lines = [
    f"# {symbol} — {name}",
    f"Industry: {industry or 'n/a'}",
    f"Geography: {geography or 'n/a'}",
    f"As of: {today}",
    "",
    "## Profile",
    profile_text or "(no profile available)",
    "",
    "## Sources",
]
if sources:
    for idx, entry in enumerate(sources, start=1):
        url = entry.get("url") or ""
        title = entry.get("title") or ""
        lines.append(f"[{idx}] {url} — {title}".rstrip(" —"))
else:
    lines.append("(no sources)")

lines.append("")
lines.append("## Findings")
if bullets:
    lines.extend(f"- {bullet}" for bullet in bullets)
else:
    lines.append("- None.")

report_path.parent.mkdir(parents=True, exist_ok=True)
tmp_path = report_path.with_suffix(report_path.suffix + ".tmp")
tmp_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
tmp_path.replace(report_path)

stored = 0
failed = []
for item in memory_items:
    ok, err = store_memory(item)
    if ok:
        stored += 1
    else:
        failed.append(err)

result = {
    "report": str(report_path),
    "workRoot": str(work_root),
    "findings": len(bullets),
    "memoryAttempts": len(memory_items),
    "memoryStored": stored,
    "memoryFailed": len(failed),
    "sourceCount": len(sources),
}
if failed:
    result["firstMemoryError"] = (failed[0] or "")[:500]
print(json.dumps(result, ensure_ascii=False))
