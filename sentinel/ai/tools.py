"""Tool catalog and executors for the Sentinel AI pipeline.

Parity port of the four tools Clara's research tasks actually use:

- ``read_file`` / ``write_file`` — UTF-8 file access. ``write_file`` is
  confined to the task working directory (Sentinel adaptation; Clara's
  filesystem tool is unconstrained, but every real prompt writes under
  TASK_CWD). ``read_file`` stays faithful: no confinement, relative paths
  resolve against the working directory.
- ``read_url`` — the Clara URL summarizer service
  (``POST {base}/v1/articles/read``). ``includeContent`` is always sent as
  ``true`` (Clara hardcodes it); the content section is shown when the
  model asked for it or the summary came back empty.
- ``searxng_web_search`` — the mcp-searxng MCP server: argument validation
  (invalid → ``Invalid arguments for web search``), safesearch numeric
  coercion, ``GET {base}/search?format=json`` with the exact parameter
  order, client-side ``min_score`` filter and ``num_results`` slice, and
  the text/JSON rendering formats including metadata sections.

Executors receive already path-expanded arguments (see ``llm.expand_paths``)
and return either a plain string or a ``{"text", "data"}`` dict; the runner
in ``llm.py`` serializes, caps, and wraps failures.
"""

from __future__ import annotations

import json
import math
import os
import re
from pathlib import Path
from typing import Any, TypeGuard
from urllib.parse import urlencode, urljoin, urlsplit, urlunsplit

import httpx

from sentinel.ai.errors import AIPipelineError

# --- constants (mcp-searxng defaults, verified against dist) -----------------

VALID_TIME_RANGES = ("day", "week", "month", "year")
VALID_RESULT_DETAILS = ("compact", "full")
VALID_RESPONSE_FORMATS = ("text", "json")
# Schema enum is strings only (mcp-searxng inputSchema); runtime validation also
# accepts numeric 0/1/2 (types.js VALID_SAFESEARCH_VALUES).
SAFESEARCH_SCHEMA_ENUM = ("0", "1", "2")
VALID_SAFESEARCH_VALUES = (0, 1, 2, "0", "1", "2")

SEARCH_TIMEOUT = httpx.Timeout(10.0)
SEARCH_FALLBACK_TIMEOUT = httpx.Timeout(60.0)
SUMMARIZER_TIMEOUT = 120.0

# --- tool definitions (byte-pinned: llm-strings.json + code schemas) ---------

_PATH_DESCRIPTION = (
    "Path to the file. Supports @/ and ~/ path shorthands, plus TASK_CWD, "
    'Task_CWD(), and Task_CWD("task-id") during task execution.'
)

TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read a UTF-8 file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": _PATH_DESCRIPTION},
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write UTF-8 content to a file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": _PATH_DESCRIPTION},
                    "content": {"type": "string", "description": "Content to write."},
                    "append": {"type": "boolean", "description": "Append instead of overwrite."},
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_url",
            "description": "Read a URL through the URL summarizer service.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "Absolute http(s) URL."},
                    "include_content": {
                        "type": "boolean",
                        "description": "Include the extracted markdown content when available.",
                    },
                    "refresh": {
                        "type": "boolean",
                        "description": "Bypass the cache and fetch the URL again.",
                    },
                },
                "required": ["url"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "searxng_web_search",
            "description": "External MCP tool searxng_web_search from searxng.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "pageno": {"type": "integer", "minimum": 1, "default": 1},
                    "time_range": {
                        "type": "string",
                        "enum": list(VALID_TIME_RANGES),
                    },
                    "language": {"type": "string", "default": "all"},
                    "safesearch": {"type": "string", "enum": list(SAFESEARCH_SCHEMA_ENUM)},
                    "min_score": {"type": "number", "minimum": 0, "maximum": 1},
                    "num_results": {"type": "number", "minimum": 1, "maximum": 20},
                    "categories": {"type": "string"},
                    "engines": {"type": "string"},
                    "response_format": {"type": "string", "enum": list(VALID_RESPONSE_FORMATS)},
                    "result_detail": {"type": "string", "enum": list(VALID_RESULT_DETAILS)},
                },
                "required": ["query"],
            },
        },
    },
]


# --- argument validation (mcp-searxng types.js isSearXNGWebSearchArgs parity) -


def _valid_pageno(value: Any) -> bool:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    if isinstance(value, float) and (math.isnan(value) or not value.is_integer()):
        return False
    return value >= 1


def _valid_num_results(value: Any) -> bool:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    if isinstance(value, float) and (math.isnan(value) or not value.is_integer()):
        return False
    return 1 <= value <= 20


def _valid_min_score(value: Any) -> bool:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    if isinstance(value, float) and math.isnan(value):
        return False
    return 0 <= value <= 1


def _valid_safesearch(value: Any) -> bool:
    if isinstance(value, bool) or not isinstance(value, (int, str)):
        return False
    return value in VALID_SAFESEARCH_VALUES


def _valid_string_enum(value: Any, allowed: tuple[str, ...]) -> bool:
    return isinstance(value, str) and value in allowed


def validate_search_args(args: Any) -> bool:
    if not isinstance(args, dict):
        return False
    if "query" not in args or not isinstance(args["query"], str):
        return False
    if "pageno" in args and not _valid_pageno(args["pageno"]):
        return False
    if "result_detail" in args and not _valid_string_enum(args["result_detail"], VALID_RESULT_DETAILS):
        return False
    if "time_range" in args and not _valid_string_enum(args["time_range"], VALID_TIME_RANGES):
        return False
    if "language" in args and not isinstance(args["language"], str):
        return False
    if "safesearch" in args and not _valid_safesearch(args["safesearch"]):
        return False
    if "min_score" in args and not _valid_min_score(args["min_score"]):
        return False
    if "num_results" in args and not _valid_num_results(args["num_results"]):
        return False
    if "categories" in args and not isinstance(args["categories"], str):
        return False
    if "engines" in args and not isinstance(args["engines"], str):
        return False
    if "response_format" in args and not _valid_string_enum(args["response_format"], VALID_RESPONSE_FORMATS):
        return False
    return True


# --- SearXNG search (mcp-searxng search.js parity) ----------------------------


def _normalize_time_range(value: Any) -> str | None:
    return value if value in VALID_TIME_RANGES else None


def _normalize_language(value: Any) -> str | None:
    return value if value and value != "all" else None


def _normalize_safesearch(value: Any) -> str | None:
    # JS parity: Number(value) coercion, then [0, 1, 2].includes(SameValueZero).
    if isinstance(value, str):
        return value if value in ("0", "1", "2") else None
    return str(value) if value in (0, 1, 2) else None


def build_search_url(
    base: str,
    *,
    query: str,
    pageno: int,
    time_range: str | None,
    language: str | None,
    safesearch: int | None,
    categories: str | None,
    engines: str | None,
) -> str:
    if not base.endswith("/"):
        base += "/"
    parts = urlsplit(base)
    path = parts.path + "search" if parts.path.endswith("/") else parts.path.rstrip("/") + "/search"
    base_url = urlunsplit((parts.scheme, parts.netloc, path, "", ""))
    params: list[tuple[str, str]] = [("q", query), ("format", "json"), ("pageno", str(pageno))]
    tr = _normalize_time_range(time_range)
    if tr is not None:
        params.append(("time_range", tr))
    lang = _normalize_language(language)
    if lang is not None:
        params.append(("language", lang))
    ss = _normalize_safesearch(safesearch)
    if ss is not None:
        params.append(("safesearch", ss))
    if categories and categories.strip():
        params.append(("categories", categories))
    if engines and engines.strip():
        params.append(("engines", engines))
    return base_url + "?" + urlencode(params)


def _server_error(status: int, status_text: str) -> AIPipelineError:
    if status == 403:
        return AIPipelineError("🚫 SearXNG server Error (403): Authentication required or IP blocked")
    if status == 404:
        return AIPipelineError("🚫 SearXNG server Error (404): Search endpoint not found")
    if status == 429:
        return AIPipelineError("🚫 SearXNG server Error (429): Rate limit exceeded")
    if status >= 500:
        return AIPipelineError("🚫 SearXNG server Error (%d): Internal server error" % status)
    return AIPipelineError("🚫 SearXNG server Error (%d): %s" % (status, status_text))


def _json_error(body: str) -> AIPipelineError:
    # JS parity: substring(0, 100).replace(/\n/g, " ") — \n only.
    preview = body[:100].replace("\n", " ")
    return AIPipelineError(
        '🔍 SearXNG Response Error: Invalid JSON format. Response: "'
        f'{preview}...". Enable - json under search.formats in your SearXNG settings.yml, '
        "or set SEARXNG_HTML_FALLBACK=true."
    )


def _network_error(exc: httpx.HTTPError, url: str) -> AIPipelineError:
    chain: list[BaseException] = [exc]
    cause: BaseException | None = exc.__cause__
    while cause is not None and cause not in chain:
        chain.append(cause)
        cause = cause.__cause__
    text = " ".join(str(c) for c in chain).lower()

    if "refused" in text:
        return AIPipelineError(f"🌐 Connection Error: SearXNG server is not responding ({url})")
    if any(
        marker in text
        for marker in (
            "getaddrinfo",
            "name or service not known",
            "temporary failure in name resolution",
            "nodename nor servname",
            "failed to resolve",
        )
    ):
        return AIPipelineError(f'🌐 DNS Error: Cannot resolve hostname "{urlsplit(url).hostname or url}"')
    if isinstance(exc, httpx.TimeoutException):
        return AIPipelineError("🌐 Timeout Error: SearXNG server is too slow to respond")
    if "certificate" in text or "ssl" in text or "tls" in text:
        return AIPipelineError(
            "🔒 SSL/TLS Error: Certificate verification failed for SearXNG server "
            "(unknown). Run: sudo cp /path/to/ca.crt /usr/local/share/ca-certificates/ "
            "&& sudo update-ca-certificates"
        )
    return AIPipelineError(
        "🌐 Network Error: fetch failed. Check if the SEARXNG_URL is correct and the SearXNG server is available"
    )


def _as_safe_string(value: Any) -> str:
    return value if isinstance(value, str) else ""


def _required_string_arg(args: dict[str, Any], field: str) -> str:
    value = args.get(field)
    if not isinstance(value, str):
        raise AIPipelineError(f"{field} must be a string")
    if not value.strip():
        raise AIPipelineError(f"{field} is required")
    return value


def _string_arg(args: dict[str, Any], field: str) -> str:
    value = args.get(field)
    if not isinstance(value, str):
        raise AIPipelineError(f"{field} must be a string")
    return value


def _optional_boolean_arg(args: dict[str, Any], field: str) -> bool:
    value = args.get(field)
    if value is None:
        return False
    if not isinstance(value, bool):
        raise AIPipelineError(f"{field} must be a boolean")
    return value


def _as_text_line_string(value: Any) -> str:
    return re.sub(r"[\r\n\u2028\u2029]+", " ", _as_safe_string(value))


def _result_field(result: dict[str, Any], key: str) -> str:
    return _as_text_line_string(result.get(key))


def _format_full_result(result: dict[str, Any]) -> str:
    lines = [
        f"Title: {_result_field(result, 'title')}",
        f"Description: {_result_field(result, 'content')}",
        f"URL: {_result_field(result, 'url')}",
    ]
    score = result.get("score")
    if isinstance(score, (int, float)) and not isinstance(score, bool) and math.isfinite(score):
        lines.append(f"Relevance Score: {score:.3f}")
    engines = result.get("engines")
    if isinstance(engines, list) and all(isinstance(e, str) for e in engines):
        clean = [e for e in (_as_text_line_string(e).strip() for e in engines) if e]
        if clean:
            lines.append(f"Engines: {', '.join(clean)}")
    category = _result_field(result, "category").strip()
    if category:
        lines.append(f"Category: {category}")
    published = _result_field(result, "publishedDate").strip()
    if published:
        lines.append(f"Published Date: {published}")
    thumbnail = _result_field(result, "thumbnail").strip()
    if thumbnail:
        lines.append(f"Thumbnail: {thumbnail}")
    image_source = _result_field(result, "img_src").strip()
    if image_source:
        lines.append(f"Image Source: {image_source}")
    return "\n".join(lines)


def _format_compact_result(result: dict[str, Any]) -> str:
    return "\n".join(
        [
            f"Title: {_result_field(result, 'title')}",
            f"Description: {_result_field(result, 'content')}",
            f"URL: {_result_field(result, 'url')}",
        ]
    )


def _compact_json_results(results: list[dict[str, Any]]) -> list[dict[str, str]]:
    return [
        {
            "title": _as_safe_string(r.get("title")),
            "url": _as_safe_string(r.get("url")),
            "content": _as_safe_string(r.get("content")),
        }
        for r in results
    ]


def _has_items(value: Any) -> TypeGuard[list[Any]]:
    return isinstance(value, list) and len(value) > 0


def _format_search_metadata(data: dict[str, Any]) -> str:
    sections: list[str] = []
    answers = data.get("answers")
    if _has_items(answers):
        sections.append("\n".join(f"Direct answer: {a}" for a in answers))
    corrections = data.get("corrections")
    if _has_items(corrections):
        sections.append("\n".join(f'Spelling correction: did you mean "{c}"?' for c in corrections))
    suggestions = data.get("suggestions")
    if _has_items(suggestions):
        sections.append(f"Suggestions: {', '.join(suggestions)}")
    infoboxes = data.get("infoboxes")
    if _has_items(infoboxes):
        blocks: list[str] = []
        for infobox in infoboxes:
            if not isinstance(infobox, dict):
                continue
            lines = [f"Infobox: {_as_safe_string(infobox.get('infobox'))}"]
            content = _as_safe_string(infobox.get("content"))
            if content:
                lines.append(content)
            urls = infobox.get("urls")
            if _has_items(urls):
                for url_entry in urls:
                    if not isinstance(url_entry, dict):
                        continue
                    title = _as_safe_string(url_entry.get("title"))
                    url = _as_safe_string(url_entry.get("url"))
                    if title and url:
                        lines.append(f"{title}: {url}")
            blocks.append("\n".join(lines))
        if blocks:
            sections.append("\n\n".join(blocks))
    return "\n\n".join(s for s in sections if s)


def format_search_response(
    data: dict[str, Any],
    *,
    query: str,
    results: list[dict[str, Any]],
    response_format: str,
    result_detail: str,
) -> str:
    if response_format == "json":
        if result_detail == "compact":
            return json.dumps({"results": _compact_json_results(results)}, indent=2, ensure_ascii=False)
        return json.dumps({**data, "results": results}, indent=2, ensure_ascii=False)

    leading = _format_search_metadata(data) if result_detail == "full" else ""
    if not results:
        message = (
            f'🔍 No results found for "{query}". Try different search terms or check '
            "if SearXNG search engines are working."
        )
        return f"{leading}\n\n---\n\n{message}" if leading else message
    if result_detail == "compact":
        body = "\n\n".join(_format_compact_result(r) for r in results)
    else:
        body = "\n\n".join(_format_full_result(r) for r in results)
    return f"{leading}\n\n---\n\n{body}" if leading else body


# --- the executors -------------------------------------------------------------


class ToolExecutors:
    """Resolves the four catalog tools to async executors.

    ``.get(name)`` is consumed by the ``llm.LLMClient`` tool loop; ``aclose``
    releases the shared HTTP client.
    """

    def __init__(
        self,
        searxng_base_url: str | None,
        url_summarizer_base_url: str | None,
        work_root: Path | None,
        browser_search_base_url: str | None = None,
    ) -> None:
        self._searxng_base = (searxng_base_url or "").rstrip("/")
        self._summarizer_base = (url_summarizer_base_url or "").rstrip("/")
        self._browser_search_base = (browser_search_base_url or "").rstrip("/")
        self._work_root = work_root
        self._client = httpx.AsyncClient(timeout=SUMMARIZER_TIMEOUT)

    def get(self, name: str):
        if name == "read_file":
            return self._read_file
        if name == "write_file":
            return self._write_file
        if name == "read_url":
            return self._read_url
        if name == "searxng_web_search":
            return self._searxng_web_search
        return None

    async def aclose(self) -> None:
        await self._client.aclose()

    # -- read_file (Clara filesystem.ts: raw UTF-8, no confinement) -------------

    async def _read_file(self, args: dict[str, Any]) -> str:
        path = _required_string_arg(args, "path")
        return Path(path).read_text(encoding="utf-8")

    # -- write_file (confined to the task working directory) ---------------------

    async def _write_file(self, args: dict[str, Any]) -> str:
        path = _required_string_arg(args, "path")
        content = _string_arg(args, "content")
        append = _optional_boolean_arg(args, "append")
        if self._work_root is None:
            raise AIPipelineError("write_file requires a working directory")
        base = Path(path) if Path(path).is_absolute() else self._work_root / path
        target = Path(os.path.realpath(base))
        root = Path(os.path.realpath(self._work_root))
        if target == root or root not in target.parents:
            raise AIPipelineError(f"write_file path is outside the working directory: {path}")
        mode = "a" if append else "w"
        with target.open(mode, encoding="utf-8") as handle:
            handle.write(content)
        # Parity: bytes = JS text.length (UTF-16 code units); path echoed as passed.
        return f"OK - wrote {len(content.encode('utf-16-le')) // 2} bytes to {path}"

    # -- read_url (Clara url-summarizer-client.ts + content.ts parity) -----------

    async def _read_url(self, args: dict[str, Any]) -> dict[str, Any]:
        include_content = _optional_boolean_arg(args, "include_content")
        if not self._summarizer_base:
            raise AIPipelineError("URL summarizer base URL is not configured")
        url = _required_string_arg(args, "url")
        refresh = _optional_boolean_arg(args, "refresh")
        try:
            response = await self._client.post(
                f"{self._summarizer_base}/v1/articles/read",
                json={"url": url, "refresh": refresh, "includeContent": True},
            )
        except httpx.HTTPError as exc:
            raise AIPipelineError(f"URL summarizer request failed: {exc}") from exc
        if not response.is_success:
            body = response.text
            suffix = f": {body}" if body else ""
            raise AIPipelineError(f"URL summarizer returned HTTP {response.status_code}{suffix}")
        try:
            payload = response.json()
        except ValueError as exc:
            raise AIPipelineError(f"URL summarizer returned invalid JSON: {exc}") from exc
        if not isinstance(payload, dict):
            raise AIPipelineError("URL summarizer returned a non-object response")

        summary = _as_safe_string(payload.get("summary"))
        result_status = _as_safe_string(payload.get("status"))
        error = _as_safe_string(payload.get("error"))
        if payload.get("ok") is not True:
            if error:
                raise AIPipelineError(error)
            result_url = _as_safe_string(payload.get("url"))
            raise AIPipelineError(f"URL summarizer could not read {result_url or url}: {result_status}")

        should_include = include_content or not summary.strip()
        result_url = _as_safe_string(payload.get("url"))
        parts: list[str] = [f"URL: {result_url}", f"Cache: {_cache_status(payload.get('cacheStatus'))}", ""]
        if summary:
            parts.extend(["## Summary", summary])
        if should_include:
            parts.extend(["", "## Content", _as_safe_string(payload.get("content"))])
        data = {
            "url": result_url,
            "cache_status": _cache_status(payload.get("cacheStatus")),
            "final_url": _as_safe_string(payload.get("finalUrl")),
            "status": result_status,
            "method": _as_safe_string(payload.get("method")),
            "summary_chars": len(summary.encode("utf-16-le")) // 2,
            "content_chars": _content_chars(payload.get("contentChars")),
        }
        return {"text": "\n".join(parts), "data": data}

    # -- searxng_web_search (mcp-searxng index.js + search.js parity) -------------

    async def _searxng_web_search(self, args: dict[str, Any]) -> str:
        if not validate_search_args(args):
            raise AIPipelineError("Invalid arguments for web search")
        if not self._searxng_base:
            raise AIPipelineError("SearXNG base URL is not configured")

        try:
            result = await self._call_searxng(args)
        except AIPipelineError as exc:
            return await self._search_fallback(args, exc)
        if self._browser_search_base and _looks_like_search_failure(result):
            return await self._search_fallback(args, AIPipelineError(result))
        return result

    async def _call_searxng(self, args: dict[str, Any]) -> str:
        query: str = args["query"]
        pageno = args.get("pageno")
        if pageno is None:
            pageno = 1
        raw_safesearch = args.get("safesearch")
        safesearch = None if raw_safesearch is None else int(float(raw_safesearch))
        min_score = args.get("min_score")
        num_results = args.get("num_results")
        result_detail = args.get("result_detail") or "full"
        response_format = args.get("response_format") or "text"

        url = build_search_url(
            self._searxng_base,
            query=query,
            pageno=int(pageno),
            time_range=args.get("time_range"),
            language=args.get("language"),
            safesearch=safesearch,
            categories=args.get("categories"),
            engines=args.get("engines"),
        )
        try:
            response = await self._client.get(url, timeout=SEARCH_TIMEOUT)
        except httpx.HTTPError as exc:
            raise _network_error(exc, url) from exc

        if not response.is_success:
            raise _server_error(response.status_code, response.reason_phrase)

        try:
            data = json.loads(response.text)
        except ValueError as exc:
            raise _json_error(response.text) from exc
        if not isinstance(data, dict) or data.get("results") is None:
            raise AIPipelineError("🔍 SearXNG Data Error: Missing results array in response")

        results = [r for r in data["results"] if min_score is None or (r.get("score") or 0) >= min_score]
        sliced = results[:num_results] if num_results is not None else results
        return format_search_response(
            data,
            query=query,
            results=sliced,
            response_format=response_format,
            result_detail=result_detail,
        )

    async def _search_fallback(self, args: dict[str, Any], original_error: AIPipelineError) -> str:
        if not self._browser_search_base:
            raise original_error
        parts = urlsplit(self._browser_search_base)
        if parts.scheme not in {"http", "https"} or not parts.netloc:
            raise AIPipelineError(
                f"SearXNG failed ({original_error}); browser-search config failed "
                "(ai_browser_search_base_url must be an http(s) URL)"
            ) from original_error

        raw_limit = args.get("limit", args.get("count", args.get("num_results", 10)))
        try:
            limit = int(float(raw_limit))
        except (TypeError, ValueError, OverflowError):
            limit = 10
        limit = max(1, min(20, limit))
        url = urljoin(f"{self._browser_search_base}/", "search")
        try:
            response = await self._client.post(
                url,
                json={"query": args["query"].strip(), "limit": limit},
                timeout=SEARCH_FALLBACK_TIMEOUT,
            )
        except httpx.HTTPError as exc:
            raise AIPipelineError(f"SearXNG failed ({original_error}); browser-search fallback failed ({exc})") from exc
        text = response.text
        if not response.is_success:
            detail = text or response.reason_phrase
            raise AIPipelineError(f"SearXNG failed ({original_error}); browser-search fallback failed ({detail})")
        if not text.strip():
            raise AIPipelineError(f"SearXNG failed ({original_error}); browser-search fallback returned no results")
        return text


def _looks_like_search_failure(text: str) -> bool:
    if re.search(r"\bURL:\s*https?://", text, re.IGNORECASE):
        return False
    if len(text) > 1000:
        return False
    return (
        re.search(
            r"\b429\b|rate\s*limit|too many requests|blocked|captcha|forbidden|timed out|unavailable|no results found",
            text,
            re.IGNORECASE,
        )
        is not None
    )


def _cache_status(value: Any) -> str:
    return value if value in ("hit", "refreshed") else "miss"


def _content_chars(value: Any) -> int | float:
    # Parity with numberField: raw finite number, else 0.
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return 0
    if not math.isfinite(value):
        return 0
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def make_tool_executors(
    searxng_base_url: str | None,
    url_summarizer_base_url: str | None,
    work_root: Path | None,
    browser_search_base_url: str | None = None,
) -> ToolExecutors:
    return ToolExecutors(searxng_base_url, url_summarizer_base_url, work_root, browser_search_base_url)
