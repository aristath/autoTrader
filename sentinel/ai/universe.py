"""AI pipeline universe reconciliation.

This replaces Clara's two universe-refresh tasks inside Sentinel:

- one security unit per active Sentinel security;
- one macro unit per adequately classified country/industry bucket;
- one synthetic portfolio unit.
"""

from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from sentinel.paths import TASK_ARTIFACTS_DIR

COUNTRY_NAMES = {
    "AT": "Austria",
    "BE": "Belgium",
    "BR": "Brazil",
    "CA": "Canada",
    "CH": "Switzerland",
    "CN": "China",
    "DE": "Germany",
    "DK": "Denmark",
    "ES": "Spain",
    "FI": "Finland",
    "FR": "France",
    "GB": "United Kingdom",
    "GR": "Greece",
    "HK": "Hong Kong",
    "IE": "Ireland",
    "IN": "India",
    "IT": "Italy",
    "JP": "Japan",
    "KR": "South Korea",
    "LU": "Luxembourg",
    "NL": "Netherlands",
    "NO": "Norway",
    "SE": "Sweden",
    "SG": "Singapore",
    "TW": "Taiwan",
    "US": "United States",
}


def slugify(value: str) -> str:
    text = unicodedata.normalize("NFKD", value)
    text = text.encode("ascii", "ignore").decode("ascii").lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or hashlib.sha1(value.encode("utf-8")).hexdigest()[:16]  # noqa: S324 - stable identifier


@dataclass(frozen=True)
class MacroBucket:
    key: str
    bucket: str
    geography: str
    country_code: str
    country_name: str
    industry: str
    symbols: list[str]
    names: list[str]

    @property
    def label(self) -> str:
        return self.bucket

    def as_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "bucket": self.bucket,
            "geography": self.geography,
            "country_code": self.country_code,
            "country_name": self.country_name,
            "industry": self.industry,
            "symbols": self.symbols,
            "names": self.names,
        }


def _text(value: Any) -> str:
    return str(value or "").strip()


def normalize_security(raw: dict[str, Any]) -> dict[str, Any]:
    symbol = _text(raw.get("symbol"))
    name = _text(raw.get("name"))
    geography = _text(raw.get("geography")).upper()
    country_code = geography if len(geography) == 2 and geography != "0" else ""
    country_name = COUNTRY_NAMES.get(country_code, country_code)
    return {
        **raw,
        "symbol": symbol,
        "name": name,
        "industry": _text(raw.get("industry")),
        "geography": geography,
        "country_code": country_code,
        "country_name": country_name,
        "geography_valid": bool(country_code),
    }


async def load_security_universe(db: Any) -> list[dict[str, Any]]:
    securities = await db.get_all_securities(active_only=True)
    universe: list[dict[str, Any]] = []
    for raw in securities:
        if not isinstance(raw, dict):
            continue
        sec = normalize_security(raw)
        if sec["symbol"] and sec["name"]:
            universe.append(sec)
    return sorted(universe, key=lambda item: item["symbol"])


def compute_macro_buckets(universe: list[dict[str, Any]]) -> tuple[list[MacroBucket], list[dict[str, Any]]]:
    groups: dict[tuple[str, str], dict[str, Any]] = {}
    skipped: list[dict[str, Any]] = []
    for raw in universe:
        sec = normalize_security(raw)
        symbol = sec["symbol"]
        name = sec["name"]
        industry = sec["industry"]
        country_code = sec["country_code"]
        country_name = sec["country_name"]
        geography = sec["geography"]
        if not symbol or not name:
            skipped.append({"symbol": symbol, "name": name, "reason": "missing symbol or name"})
            continue
        if not industry:
            skipped.append({"symbol": symbol, "name": name, "geography": geography, "reason": "missing industry"})
            continue
        if not sec["geography_valid"] or not country_code:
            skipped.append(
                {
                    "symbol": symbol,
                    "name": name,
                    "industry": industry,
                    "geography": geography,
                    "reason": "missing or non-country geography",
                }
            )
            continue
        group_key = (country_code, industry)
        bucket_name = f"{country_name} + {industry}"
        entry = groups.setdefault(
            group_key,
            {
                "key": slugify(f"{country_code}-{industry}"),
                "bucket": bucket_name,
                "geography": country_code,
                "country_code": country_code,
                "country_name": country_name,
                "industry": industry,
                "symbols": [],
                "names": [],
            },
        )
        if symbol not in entry["symbols"]:
            entry["symbols"].append(symbol)
            entry["names"].append(name)
    buckets = [
        MacroBucket(
            key=item["key"],
            bucket=item["bucket"],
            geography=item["geography"],
            country_code=item["country_code"],
            country_name=item["country_name"],
            industry=item["industry"],
            symbols=item["symbols"],
            names=item["names"],
        )
        for item in groups.values()
    ]
    buckets.sort(key=lambda item: (item.country_name, item.industry, item.bucket))
    return buckets, skipped


async def reconcile_units(db: Any) -> dict[str, Any]:
    universe = await load_security_universe(db)
    buckets, skipped = compute_macro_buckets(universe)

    units = [("security", sec["symbol"], sec["name"]) for sec in universe]
    units.extend(("macro", bucket.key, bucket.label) for bucket in buckets)
    units.append(("portfolio", "portfolio", "Portfolio"))
    await db.reconcile_ai_units(units)

    return {
        "securities": universe,
        "macro_buckets": [bucket.as_dict() for bucket in buckets],
        "skipped": skipped,
    }


def _task_slug(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", str(value)).strip("-") or "item"


async def refresh_unit_artifacts(db: Any) -> None:
    """Project the ported task artifact tree into the AI unit index."""
    units = await db.get_ai_units()
    for unit in units:
        kind = str(unit.get("kind") or "")
        key = str(unit.get("key") or "")
        label = str(unit.get("label") or key)
        paths: dict[str, Any] = {}
        if kind == "security":
            stem = _task_slug(key)
            paths = {
                "report.md": TASK_ARTIFACTS_DIR / "analyze-security" / f"{stem}.md",
                "summary.md": TASK_ARTIFACTS_DIR / "analyze-security" / f"{stem}.summary.md",
                "profile.json": TASK_ARTIFACTS_DIR / "analyze-security" / f"{stem}.profile.json",
                "analysis.md": TASK_ARTIFACTS_DIR / "rate-security" / stem / "analysis.md",
                "rating.json": TASK_ARTIFACTS_DIR / "rate-security" / stem / "rating.json",
                "evidence-pack.md": TASK_ARTIFACTS_DIR / "rate-security" / stem / "evidence-pack.md",
            }
        elif kind == "macro":
            paths = {"report.md": TASK_ARTIFACTS_DIR / "analyze-macro-bucket" / f"{_task_slug(label)}.md"}
        elif kind == "portfolio":
            paths = {
                "latest.json": TASK_ARTIFACTS_DIR / "rate-portfolio" / "latest.json",
                "ratings.json": TASK_ARTIFACTS_DIR / "rate-portfolio" / "ratings.json",
            }
        existing = {name: path for name, path in paths.items() if path.is_file()}
        if not existing:
            if unit.get("artifacts") or unit.get("last_analyzed_at"):
                await db.clear_ai_unit_imported(kind, key)
            continue
        artifacts = {name: str(path.relative_to(TASK_ARTIFACTS_DIR)) for name, path in existing.items()}
        completion_names = {
            "security": {"summary.md"},
            "macro": {"report.md"},
            "portfolio": {"latest.json"},
        }.get(kind, set())
        completed = [path for name, path in existing.items() if name in completion_names]
        imported_at = (
            datetime.fromtimestamp(max(path.stat().st_mtime for path in completed), tz=timezone.utc).isoformat()
            if completed
            else None
        )
        current_artifacts = unit.get("artifacts")
        if isinstance(current_artifacts, str):
            try:
                current_artifacts = json.loads(current_artifacts)
            except json.JSONDecodeError:
                current_artifacts = None
        if current_artifacts == artifacts and unit.get("last_analyzed_at") == imported_at:
            continue
        await db.set_ai_unit_imported(
            kind,
            key,
            artifacts,
            imported_at,
        )


async def get_macro_bucket(db: Any, key: str) -> dict[str, Any] | None:
    universe = await load_security_universe(db)
    buckets, _ = compute_macro_buckets(universe)
    for bucket in buckets:
        if bucket.key == key:
            return bucket.as_dict()
    return None


async def get_security(db: Any, symbol: str) -> dict[str, Any] | None:
    row = await db.get_security(symbol)
    if not row:
        return None
    return normalize_security(row)
