"""
Extract usable source URLs from the web-search results.

Parses the Title/Description/URL blocks of the search output, drops social media,
Wikipedia, and PDF/download links, de-duplicates, and emits a ranked JSON array of
readable sources. Aborts if none remain.

Environment: SEARCH_TEXT (raw search results), WORK_ROOT (scratch dir).
"""

import json
import os
import pathlib
import re
from urllib.parse import urlparse

search_text = os.environ["SEARCH_TEXT"]
work_root = pathlib.Path(os.environ["WORK_ROOT"])
source_summaries_path = work_root / "macro-source-summaries.md"
source_summaries_path.parent.mkdir(parents=True, exist_ok=True)
source_summaries_path.write_text("", encoding="utf-8")

skip_hosts = {
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "twitter.com",
    "x.com",
    "wikipedia.org",
    "youtube.com",
}


def host_matches(host, skipped):
    return host == skipped or host.endswith("." + skipped)


entries = []
seen = set()
pattern = re.compile(
    r"Title:\s*(?P<title>.*?)\n"
    r"Description:\s*(?P<description>.*?)\n"
    r"URL:\s*(?P<url>\S+)(?:\nRelevance Score:\s*(?P<score>[^\n]+))?",
    re.S,
)
for match in pattern.finditer(search_text):
    title = " ".join(match.group("title").split())
    url = match.group("url").strip()
    if not url.startswith(("http://", "https://")) or url in seen:
        continue
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    if any(host_matches(host, skipped) for skipped in skip_hosts):
        continue
    path = parsed.path.lower()
    if "[pdf]" in title.lower() or path.endswith(".pdf") or path.endswith("/download") or "/bitstreams/" in path:
        continue
    seen.add(url)
    entries.append(
        {
            "rank": len(entries) + 1,
            "title": title,
            "description": " ".join(match.group("description").split())[:700],
            "url": url,
            "sourceSummariesPath": str(source_summaries_path),
        }
    )

if not entries:
    raise SystemExit("No readable source URLs found in search results")

print(json.dumps(entries, ensure_ascii=False))
