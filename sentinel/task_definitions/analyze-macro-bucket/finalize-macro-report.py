"""
Build the canonical macro-bucket report and persist findings to mem0.

Parses the distilled bullets, resolves [N] citations to source URLs, writes the
<bucket>.md report (sources + findings) atomically, then stores one mem0 memory per
finding x symbol (citation markers stripped from the stored text; inline URLs kept).
The report is written before any mem0 write so the artifact always survives.

Environment: ITEM_JSON (resolved bucket), DISTILL_OUTPUT (distilled findings),
             SENTINEL_BASE_URL (optional, default http://127.0.0.1:8000).
"""

import datetime as dt
import os
import json
import pathlib
import re
import urllib.error
import urllib.request

item = json.loads(os.environ["ITEM_JSON"])
bucket = item.get("bucket")
geography = item.get("geography")
country_code = item.get("country_code")
country_name = item.get("country_name")
industry = item.get("industry")
symbols = item.get("symbols")
work_root = pathlib.Path(item["workRoot"])
report_path = pathlib.Path(item["reportPath"])
url_index_path = work_root / "macro-source-index.json"

raw = os.environ["DISTILL_OUTPUT"]
if not isinstance(raw, str) or not raw.strip():
    raise SystemExit("distill-macro-findings produced no output")

if not isinstance(symbols, list):
    symbols = []

url_index = []
if url_index_path.exists():
    url_index = json.loads(url_index_path.read_text(encoding="utf-8"))
url_by_index = {int(item["index"]): item for item in url_index if isinstance(item, dict)}

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


def collect_sources(bullet):
    urls = []
    for match in CITE_PATTERN.finditer(bullet):
        for chunk in match.group(1).split(","):
            try:
                idx = int(chunk.strip())
            except ValueError:
                continue
            entry = url_by_index.get(idx)
            if entry and entry.get("url"):
                urls.append(entry["url"])
    for match in URL_PATTERN.finditer(bullet):
        urls.append(match.group(0).rstrip(".,;:!?"))
    seen, ordered = set(), []
    for url in urls:
        if url and url not in seen:
            seen.add(url)
            ordered.append(url)
    return ordered


def memory_text(bullet):
    # Strip the numeric [N] citations — they only resolve against this run's
    # source index, so they're meaningless once the bullet is sitting in mem0.
    # Inline URLs are self-describing and stay in the text.
    text = CITE_PATTERN.sub("", bullet)
    text = re.sub(r"\s+([.,;:!?])", r"\1", text)
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text


def country_label():
    if country_name and country_code:
        return f"{country_name} ({country_code})"
    return country_name or country_code or geography or "n/a"


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


bullets = extract_bullets(raw)

today = dt.date.today().isoformat()
country_code = str(country_code or geography or "").strip()
country_name = str(country_name or "").strip()

memory_items = []
for bullet in bullets:
    source_urls = collect_sources(bullet)
    mem_text = memory_text(bullet)
    if not mem_text:
        continue
    for symbol in symbols or [None]:
        symbol_value = symbol if symbol else ""
        tags = []
        for value in ["securities", symbol_value, "macro", country_code, country_name, industry]:
            if value and value not in tags:
                tags.append(value)
        metadata = {
            "domain": "securities",
            "primary_sector": "securities",
            "as_of": today,
            "symbol": symbol_value or None,
            "kind": "macro",
            "bucket": bucket,
            "geography": country_code,
            "country_code": country_code,
            "country_name": country_name,
            "industry": industry,
            "affected_symbols": symbols,
            "source_urls": source_urls,
        }
        memory_items.append(
            {
                "memory": mem_text,
                "tags": tags,
                "metadata": metadata,
            }
        )

# Build the canonical report. Write it before attempting mem0 stores so the
# artifact is always on disk even if every mem0 write fails.
lines = [
    f"# {bucket}",
    f"Country: {country_label()}",
    f"Industry: {industry or 'n/a'}",
    f"Symbols: {', '.join(symbols) if symbols else 'n/a'}",
    f"As of: {today}",
    "",
    "## Sources",
]
if url_index:
    for entry in url_index:
        idx = entry.get("index")
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
    "sourceCount": len(url_index),
}
if failed:
    result["firstMemoryError"] = (failed[0] or "")[:500]
print(json.dumps(result, ensure_ascii=False))
