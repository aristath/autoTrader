"""
Fetch and summarise each source via the url-summarizer service.

Reads every collected URL through the local url-summarizer (base URL from app
settings), appends the returned summaries to macro-source-summaries.md, and writes a
numbered macro-source-index.json so downstream [N] citations resolve to real URLs.
Aborts if no summary could be saved.

Environment: SOURCES_JSON (collected sources), WORK_ROOT (scratch dir).
"""

import json
import os
import pathlib
import urllib.request

sources = json.loads(os.environ["SOURCES_JSON"])
if not isinstance(sources, list):
    raise SystemExit("collect-macro-source-urls must return a JSON array")

out_path = (
    pathlib.Path(sources[0]["sourceSummariesPath"])
    if sources
    else pathlib.Path(os.environ["WORK_ROOT"]) / "macro-source-summaries.md"
)
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text("", encoding="utf-8")

# Also write a deterministic numbered URL index so downstream steps can
# resolve [N] citations back to source URLs without trusting the LLM to
# re-list them faithfully.
url_index_path = out_path.parent / "macro-source-index.json"


def url_summarizer_base_url():
    return str(os.environ.get("SENTINEL_URL_SUMMARIZER_BASE_URL") or "http://127.0.0.1:8890").rstrip("/")


def read_article(service_base_url, source):
    payload = json.dumps(
        {
            "url": source.get("url"),
            "title": source.get("title") or "",
            "includeContent": False,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        f"{service_base_url}/v1/articles/read",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        return json.loads(response.read().decode("utf-8"))


service_base_url = url_summarizer_base_url()
saved_count = 0
url_index = []

with out_path.open("a", encoding="utf-8") as handle:
    for source in sources:
        try:
            result = read_article(service_base_url, source)
        except Exception:
            continue

        if not result.get("ok"):
            continue
        summary = str(result.get("summary") or "").strip()
        if not summary:
            continue

        saved_count += 1
        resolved_title = result.get("title") or source.get("title") or ""
        resolved_url = result.get("url") or source.get("url") or ""
        url_index.append(
            {
                "index": saved_count,
                "title": resolved_title,
                "url": resolved_url,
            }
        )
        handle.write(f"\n\n## Source {saved_count}: {resolved_title}\n")
        handle.write(f"URL: {resolved_url}\n")
        handle.write(f"Cache: {result.get('cacheStatus') or 'unknown'}\n")
        handle.write("\n")
        handle.write(summary)
        handle.write("\n")

if saved_count == 0:
    raise SystemExit("No macro source summaries were saved")

url_index_path.write_text(json.dumps(url_index, ensure_ascii=False, indent=2), encoding="utf-8")

print(
    json.dumps(
        {
            "sourceSummariesPath": str(out_path),
            "urlIndexPath": str(url_index_path),
            "sourceCount": saved_count,
        },
        ensure_ascii=False,
    )
)
