"""For one research query, fetch + summarise its sources via the url-summarizer,
writing per-query summaries/index files keyed by a query hash. Emits the paths and
source count for the findings prompt.
Environment: WORK_ROOT, QUERY, SEARCH_TEXT."""

import os
import hashlib
import json
import pathlib
import re
import time
import urllib.request
from urllib.parse import urlparse

work_root = pathlib.Path(os.environ["WORK_ROOT"])
query = " ".join(str(os.environ.get("QUERY") or "").split())
if not query:
    raise SystemExit("query is empty")

query_hash = hashlib.sha1(query.encode("utf-8")).hexdigest()[:16]
source_summaries_path = work_root / "query-source-summaries" / f"{query_hash}.md"
source_index_path = work_root / "query-source-index" / f"{query_hash}.json"
source_summaries_path.parent.mkdir(parents=True, exist_ok=True)
source_index_path.parent.mkdir(parents=True, exist_ok=True)
source_summaries_path.write_text("", encoding="utf-8")

search_text = str(os.environ.get("SEARCH_TEXT") or "")

skip_hosts = {
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "twitter.com",
    "x.com",
    "youtube.com",
}


def host_matches(host, skipped):
    return host == skipped or host.endswith("." + skipped)


def url_summarizer_base_url():
    return str(os.environ.get("SENTINEL_URL_SUMMARIZER_BASE_URL") or "http://127.0.0.1:8890").rstrip("/")


def read_article(service_base_url, candidate):
    payload = json.dumps(
        {
            "url": candidate["url"],
            "title": candidate["title"],
            "includeContent": False,
        }
    ).encode("utf-8")
    last_error = None
    for attempt in range(3):
        req = urllib.request.Request(
            f"{service_base_url}/v1/articles/read",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as error:
            last_error = error
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
    if last_error is not None:
        raise last_error
    raise RuntimeError("URL summarizer failed without an error")


candidates = []
seen = set()
pattern = re.compile(
    r"Title:\s*(?P<title>.*?)\n"
    r"Description:\s*(?P<description>.*?)\n"
    r"URL:\s*(?P<url>\S+)(?:\nRelevance Score:\s*(?P<score>[^\n]+))?",
    re.S,
)
for match in pattern.finditer(search_text):
    url = match.group("url").strip()
    title = " ".join(match.group("title").split())
    if not url.startswith(("http://", "https://")) or not title or url in seen:
        continue
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    path = parsed.path.lower()
    if any(host_matches(host, skipped) for skipped in skip_hosts):
        continue
    if "[pdf]" in title.lower() or path.endswith(".pdf") or path.endswith("/download") or "/bitstreams/" in path:
        continue
    seen.add(url)
    candidates.append({"title": title, "url": url})

service_base_url = url_summarizer_base_url()
saved = []
with source_summaries_path.open("a", encoding="utf-8") as handle:
    for candidate in candidates:
        try:
            fetched = read_article(service_base_url, candidate)
        except Exception:
            continue
        if not fetched.get("ok"):
            continue
        summary = str(fetched.get("summary") or "").strip()
        if not summary:
            continue
        idx = len(saved) + 1
        title = fetched.get("title") or candidate["title"]
        url = fetched.get("url") or candidate["url"]
        saved.append({"index": idx, "title": title, "url": url})
        handle.write(f"\n\n## Source {idx}: {title}\n")
        handle.write(f"URL: {url}\n\n")
        handle.write(summary)
        handle.write("\n")

source_index_path.write_text(json.dumps(saved, ensure_ascii=False, indent=2), encoding="utf-8")

print(
    json.dumps(
        {
            "query": query,
            "queryHash": query_hash,
            "sourceSummariesPath": str(source_summaries_path),
            "sourceIndexPath": str(source_index_path),
            "findingsPath": str(work_root / "query-findings" / f"{query_hash}.md"),
            "sourceCount": len(saved),
        },
        ensure_ascii=False,
    )
)
