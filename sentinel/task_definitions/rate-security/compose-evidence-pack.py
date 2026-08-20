"""
Build the evidence pack the analyst reads to rate one security.

Assembles three sections: the current security-research file, the current macro
context for every bucket the symbol belongs to (each annotated with file age), and a
6-month window of historical mem0 records (security findings, prior research
summaries, macro findings) retrieved by tag. Writes evidence-pack.md and reports the
freshness/coverage of each input.

Environment: CONTEXT_JSON (resolve-rating-context output),
             SENTINEL_BASE_URL (optional, default http://127.0.0.1:8000).
"""

import os
import datetime as dt
import json
import pathlib
import urllib.error
import urllib.parse
import urllib.request

ctx = json.loads(os.environ["CONTEXT_JSON"])
symbol = ctx["symbol"]
name = ctx["name"]
industry = ctx["industry"]
geography = ctx["geography"]
security_path = pathlib.Path(ctx["securityPath"])
evidence_pack_path = pathlib.Path(ctx["evidencePackPath"])
work_root = pathlib.Path(ctx["workRoot"])

evidence_pack_path.parent.mkdir(parents=True, exist_ok=True)

today = dt.date.today()
# 6-month historical window for mem0 retrieval.
window_start = today - dt.timedelta(days=183)


def file_age_days(path):
    try:
        stat = path.stat()
    except FileNotFoundError:
        return None
    delta = (dt.datetime.now().timestamp() - stat.st_mtime) / 86400.0
    return round(delta, 1)


def fetch_memories(tag_list, limit=200):
    qs = urllib.parse.urlencode({"tag": ",".join(tag_list), "limit": str(limit)})
    url = f"{os.environ.get('SENTINEL_BASE_URL', 'http://127.0.0.1:8000')}/api/memory/memories?{qs}"
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.HTTPError, urllib.error.URLError) as error:
        return [], str(error)
    items = payload.get("items") if isinstance(payload, dict) else None
    return items or [], None


def parse_as_of(metadata):
    raw = (metadata or {}).get("as_of") or (metadata or {}).get("asOf")
    if not raw:
        return None
    try:
        return dt.date.fromisoformat(str(raw)[:10])
    except ValueError:
        return None


# --- Section 1: current security research ---
security_section = []
sec_age = file_age_days(security_path)
if sec_age is None:
    security_section.append("(security-research file missing — rating will be evidence-thin)")
else:
    security_section.append(f"(as of file mtime — {sec_age} days old)")
    security_section.append("")
    security_section.append(security_path.read_text(encoding="utf-8"))

# --- Section 2: current macro context per bucket ---
macro_sections = []
macro_status = []
for bucket in ctx["buckets"]:
    bucket_path = pathlib.Path(bucket["path"])
    age = file_age_days(bucket_path)
    label_parts = [bucket["bucket"]]
    if bucket["country_name"]:
        label_parts.append(f"({bucket['country_name']})")
    if age is None:
        macro_status.append({"bucket": bucket["bucket"], "ageDays": None, "missing": True})
        macro_sections.append(
            f"### Bucket: {' '.join(label_parts)}\n\n(macro-context file missing — refresh `analyze-macro-bucket` for this bucket)"
        )
        continue
    macro_status.append({"bucket": bucket["bucket"], "ageDays": age, "missing": False})
    macro_sections.append(
        f"### Bucket: {' '.join(label_parts)}\n\n(as of file mtime — {age} days old)\n\n{bucket_path.read_text(encoding='utf-8')}"
    )

# --- Section 3: historical mem0 records, last 6 months ---
research_memories, research_err = fetch_memories(["securities", symbol, "query-source-summary"])
research_summary_memories, research_summary_err = fetch_memories(["securities", symbol, "research-summary"])
macro_memories, macro_err = fetch_memories(["securities", symbol, "macro"])


def render_memory_lines(memories, label):
    rendered = []
    kept = 0
    for record in memories:
        metadata = record.get("metadata") or {}
        as_of = parse_as_of(metadata)
        if not as_of or as_of < window_start:
            continue
        category = metadata.get("category") or metadata.get("kind") or ""
        content = (record.get("content") or "").strip()
        if not content:
            continue
        urls = metadata.get("source_urls") or []
        url_str = ""
        if isinstance(urls, list) and urls:
            url_str = f" — source: {urls[0]}"
        elif isinstance(urls, str) and urls:
            url_str = f" — source: {urls}"
        line = f"- {as_of.isoformat()} [{category}] {content}{url_str}"
        rendered.append(line)
        kept += 1
    return rendered, kept


research_lines, research_count = render_memory_lines(research_memories, "research")
research_summary_lines, research_summary_count = render_memory_lines(research_summary_memories, "research-summary")
macro_lines, macro_count = render_memory_lines(macro_memories, "macro")

historical_sections = []
historical_sections.append("### Security findings (last 6 months from mem0)")
if research_lines:
    historical_sections.extend(research_lines)
else:
    historical_sections.append("(no security findings in the 6-month window)")
historical_sections.append("")
historical_sections.append("### Prior research summaries (last 6 months from mem0)")
if research_summary_lines:
    historical_sections.extend(research_summary_lines)
else:
    historical_sections.append("(no prior research summaries in the 6-month window)")
historical_sections.append("")
historical_sections.append("### Macro findings affecting this symbol (last 6 months from mem0)")
if macro_lines:
    historical_sections.extend(macro_lines)
else:
    historical_sections.append("(no macro findings in the 6-month window)")

# --- Assemble evidence pack ---
lines = [
    f"# Evidence Pack for {symbol} — {name}",
    f"Industry: {industry or 'n/a'}",
    f"Geography: {geography or 'n/a'}",
    f"As of: {today.isoformat()}",
    "",
    "Investment horizon: 5-10 years. Day-to-day and quarterly performance are noise; structural trajectory is signal.",
    "",
    "## Current Security Research",
]
lines.extend(security_section)
lines.append("")
lines.append("## Current Macro Context")
if macro_sections:
    for section in macro_sections:
        lines.append("")
        lines.append(section)
else:
    lines.append("(no buckets matched for this symbol)")
lines.append("")
lines.append(f"## Historical Context (last 6 months, mem0 retrieval)")
lines.extend(historical_sections)

evidence_pack_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")

print(
    json.dumps(
        {
            "evidencePack": str(evidence_pack_path),
            "securityFileAgeDays": sec_age,
            "macroBuckets": macro_status,
            "historicalResearchCount": research_count,
            "historicalResearchSummaryCount": research_summary_count,
            "historicalMacroCount": macro_count,
            "memoryReadErrors": [e for e in [research_err, research_summary_err, macro_err] if e],
        },
        ensure_ascii=False,
    )
)
