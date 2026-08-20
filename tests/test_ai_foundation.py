"""Tests for the AI pipeline unit index used by task observability.

Covers:
1. ai_units schema and artifact projection
2. Unit roster reconciliation
3. The normal scheduler timeout
"""

import json
import os
import tempfile
from datetime import datetime, timezone
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio

from sentinel.api.routers.ai import _run_identity, get_ai_models
from sentinel.database import Database


@pytest_asyncio.fixture
async def temp_db():
    """Create a temporary database for testing."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name

    db = Database(db_path)
    await db.connect()

    yield db

    await db.close()
    db.remove_from_cache()
    if os.path.exists(db_path):
        os.unlink(db_path)
    for ext in ["-wal", "-shm"]:
        wal_path = db_path + ext
        if os.path.exists(wal_path):
            os.unlink(wal_path)


class TestAiUnitSchema:
    """Schema tests for the AI observability unit index."""

    @pytest.mark.asyncio
    async def test_tables_exist(self, temp_db):
        cursor = await temp_db.conn.execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        tables = {row["name"] for row in await cursor.fetchall()}
        assert "ai_units" in tables
        assert "ai_requests" not in tables

    @pytest.mark.asyncio
    async def test_ai_units_default_state(self, temp_db):
        await temp_db.upsert_ai_unit("security", "AETF.GR", "AegEAN")
        row = await temp_db.get_ai_unit("security", "AETF.GR")
        assert row is not None
        assert row["last_analyzed_at"] is None
        assert row["artifacts"] is None


class TestAiUnitLifecycle:
    """Unit state machine: upsert, prune, claim, complete, fail, recover."""

    @pytest.mark.asyncio
    async def test_upsert_refreshes_label_but_never_overwrites_state(self, temp_db):
        await temp_db.upsert_ai_unit("macro", "gr-tech", "GR / Technology")
        imported_at = datetime.now(timezone.utc).isoformat()
        await temp_db.set_ai_unit_imported("macro", "gr-tech", {"report.md": "macro/gr-tech/report.md"}, imported_at)
        # Re-upsert (reconcile ran again with a renamed label) — state must survive
        await temp_db.upsert_ai_unit("macro", "gr-tech", "GR / Technology (renamed)")
        row = await temp_db.get_ai_unit("macro", "gr-tech")
        assert row["label"] == "GR / Technology (renamed)"  # label refreshed
        assert row["last_analyzed_at"] is not None  # state kept

    @pytest.mark.asyncio
    async def test_prune_removes_only_unlisted_keys(self, temp_db):
        await temp_db.upsert_ai_unit("security", "AAA", "A")
        await temp_db.upsert_ai_unit("security", "BBB", "B")
        await temp_db.upsert_ai_unit("security", "CCC", "C")
        removed = await temp_db.prune_ai_units("security", ["AAA", "CCC"])
        assert removed == 1
        keys = {u["key"] for u in await temp_db.get_ai_units("security")}
        assert keys == {"AAA", "CCC"}

    @pytest.mark.asyncio
    async def test_prune_does_not_touch_other_kinds(self, temp_db):
        await temp_db.upsert_ai_unit("security", "AAA", "A")
        await temp_db.upsert_ai_unit("macro", "AAA", "A-macro")
        removed = await temp_db.prune_ai_units("security", [])
        assert removed == 1
        assert await temp_db.get_ai_unit("macro", "AAA") is not None

    @pytest.mark.asyncio
    async def test_import_preserves_last_analyzed_at(self, temp_db):
        await temp_db.upsert_ai_unit("security", "AAA", "A")
        imported_at = datetime(2026, 1, 2, 3, 4, tzinfo=timezone.utc).isoformat()
        artifacts = {"report.md": "security/AAA/report.md"}
        await temp_db.set_ai_unit_imported("security", "AAA", artifacts, imported_at)
        row = await temp_db.get_ai_unit("security", "AAA")
        assert row["last_analyzed_at"] == imported_at
        assert json.loads(row["artifacts"]) == artifacts


class TestAiUniverseReconciliation:
    """Sentinel securities become AI units without Clara's scheduler."""

    @pytest.mark.asyncio
    async def test_reconcile_creates_security_macro_and_portfolio_units(self, temp_db):
        from sentinel.ai.universe import reconcile_units

        await temp_db.upsert_security(
            "AAA",
            name="Alpha Corp",
            active=1,
            geography="US",
            industry="Semiconductors",
        )
        await temp_db.upsert_security(
            "OLD",
            name="Inactive Corp",
            active=0,
            geography="US",
            industry="Semiconductors",
        )

        result = await reconcile_units(temp_db)
        units = await temp_db.get_ai_units()
        keys = {(unit["kind"], unit["key"]) for unit in units}

        assert ("security", "AAA") in keys
        assert ("security", "OLD") not in keys
        assert ("portfolio", "portfolio") in keys
        assert any(unit["kind"] == "macro" and unit["label"] == "United States + Semiconductors" for unit in units)
        assert result["securities"][0]["symbol"] == "AAA"


class TestRunnerIntegration:
    """The normal scheduler retains its standard timeout."""

    def test_default_jobs_keep_15m_timeout(self):
        from sentinel.jobs import runner

        assert runner.job_timeout("sync:prices") == runner.JOB_TIMEOUT == 15 * 60


def test_pipeline_run_identity_uses_security_and_macro_units():
    units = [
        {"kind": "security", "key": "AAA", "label": "Alpha"},
        {"kind": "macro", "key": "us-tech", "label": "US + Technology"},
    ]

    security = _run_identity(
        {"taskId": "analyze-security", "taskName": "Analyze Security", "inputs": {"symbol": "AAA"}},
        units,
    )
    macro = _run_identity(
        {
            "taskId": "analyze-macro-bucket",
            "taskName": "Analyze Macro Bucket",
            "inputs": {"bucket": "US + Technology"},
        },
        units,
    )

    assert security == {"unit_kind": "security", "unit_key": "AAA", "unit_label": "Alpha"}
    assert macro == {"unit_kind": "macro", "unit_key": "us-tech", "unit_label": "US + Technology"}


@pytest.mark.asyncio
async def test_model_discovery_endpoint_uses_settings_and_survives_offline_llm():
    values = {"ai_llm_base_url": "http://llm/v1", "ai_llm_api_key": "test-key"}
    settings = SimpleNamespace(get=AsyncMock(side_effect=lambda key, default: values.get(key, default)))
    deps: Any = SimpleNamespace(settings=settings)

    with patch("sentinel.api.routers.ai.discover_models", new=AsyncMock(return_value=["model-b", "model-a"])):
        assert await get_ai_models(deps) == {"ok": True, "models": ["model-b", "model-a"]}

    with patch("sentinel.api.routers.ai.discover_models", new=AsyncMock(side_effect=RuntimeError("offline"))):
        assert await get_ai_models(deps) == {"ok": False, "models": [], "error": "offline"}
