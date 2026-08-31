"""Concurrency invariants for the production SQLite operation pipeline."""

from __future__ import annotations

import ast
import asyncio
import os
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
import pytest_asyncio
from fastapi import FastAPI

from sentinel.api.dependencies import CommonDependencies, get_common_deps
from sentinel.api.routers.securities import unified_router
from sentinel.database import Database
from sentinel.database.simulation import SimulationDatabase


def test_production_modules_do_not_bypass_database_pipeline():
    sentinel_root = Path(__file__).parents[1] / "sentinel"
    violations: list[str] = []

    for path in sentinel_root.rglob("*.py"):
        if path.parent.name == "database":
            continue
        tree = ast.parse(path.read_text(), filename=str(path))
        for node in ast.walk(tree):
            if isinstance(node, ast.Attribute) and node.attr == "conn":
                violations.append(f"{path.relative_to(sentinel_root)}:{node.lineno}")

    assert violations == []


@pytest_asyncio.fixture
async def pipeline_db():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as database_file:
        path = database_file.name

    db = Database(path)
    await db.connect()
    try:
        yield db
    finally:
        await db.close()
        db.remove_from_cache()
        for suffix in ("", "-wal", "-shm"):
            candidate = path + suffix
            if os.path.exists(candidate):
                os.unlink(candidate)


@pytest.mark.asyncio
async def test_cash_balance_replacement_exposes_only_committed_snapshots(pipeline_db):
    old_balances = {"OLD": 1.0}
    new_balances = {f"C{i:04d}": float(i) for i in range(1_200)}
    await pipeline_db.set_cash_balances(old_balances)

    observed: list[dict[str, float]] = []
    reader_started = asyncio.Event()
    stop_reader = asyncio.Event()

    async def read_repeatedly() -> None:
        while not stop_reader.is_set():
            observed.append(await pipeline_db.get_cash_balances())
            reader_started.set()
            await asyncio.sleep(0)

    reader = asyncio.create_task(read_repeatedly())
    await reader_started.wait()
    try:
        await pipeline_db.set_cash_balances(new_balances)
    finally:
        stop_reader.set()
        await reader

    assert observed
    assert all(snapshot == old_balances or snapshot == new_balances for snapshot in observed)
    assert await pipeline_db.get_cash_balances() == new_balances


@pytest.mark.asyncio
async def test_concurrent_cash_replacements_do_not_interleave(pipeline_db):
    first = {f"A{i:03d}": float(i) for i in range(200)}
    second = {f"B{i:03d}": float(i) for i in range(200)}

    await asyncio.gather(
        pipeline_db.set_cash_balances(first),
        pipeline_db.set_cash_balances(second),
    )

    assert await pipeline_db.get_cash_balances() in (first, second)


@pytest.mark.asyncio
async def test_cancelled_write_rolls_back_before_next_operation(pipeline_db, monkeypatch):
    committed = {"EUR": 100.0, "USD": 50.0}
    await pipeline_db.set_cash_balances(committed)

    delete_completed = asyncio.Event()
    original_execute = pipeline_db.conn.execute

    async def pause_after_delete(sql, *args, **kwargs):
        cursor = await original_execute(sql, *args, **kwargs)
        if sql == "DELETE FROM cash_balances":
            delete_completed.set()
            await asyncio.Event().wait()
        return cursor

    monkeypatch.setattr(pipeline_db.conn, "execute", pause_after_delete)
    writer = asyncio.create_task(pipeline_db.set_cash_balances({"GBP": 25.0}))
    await delete_completed.wait()
    writer.cancel()
    with pytest.raises(asyncio.CancelledError):
        await writer

    assert await pipeline_db.get_cash_balances() == committed
    assert pipeline_db.conn.in_transaction is False


@pytest.mark.asyncio
async def test_task_persistence_reuses_primary_connection(pipeline_db, monkeypatch):
    async def unexpected_connect(*args, **kwargs):
        raise AssertionError("task persistence opened a second SQLite connection")

    monkeypatch.setattr("sentinel.database.tasks.aiosqlite.connect", unexpected_connect)

    await pipeline_db.upsert_task_schedule(
        "task:test:stale",
        "test",
        {"type": "stale_after", "seconds": 60},
        {"runWhen": "idle", "priority": 0},
    )
    schedule = await pipeline_db.get_task_schedule("task:test:stale")

    assert schedule is not None
    assert schedule["task_id"] == "test"
    foreign_keys = await (await pipeline_db.conn.execute("PRAGMA foreign_keys")).fetchone()
    assert foreign_keys[0] == 0


@pytest.mark.asyncio
async def test_task_write_waits_for_in_flight_primary_read(pipeline_db, monkeypatch):
    await pipeline_db.set_setting("pipeline-probe", "ready")
    read_started = asyncio.Event()
    release_read = asyncio.Event()
    original_execute = pipeline_db.conn.execute

    async def pause_read(sql, *args, **kwargs):
        cursor = await original_execute(sql, *args, **kwargs)
        if sql == "SELECT value FROM settings WHERE key = ?":
            read_started.set()
            await release_read.wait()
        return cursor

    monkeypatch.setattr(pipeline_db.conn, "execute", pause_read)
    reader = asyncio.create_task(pipeline_db.get_setting("pipeline-probe"))
    await read_started.wait()
    task_writer = asyncio.create_task(
        pipeline_db.upsert_task_schedule(
            "task:queued-behind-read:stale",
            "queued-behind-read",
            {"type": "stale_after", "seconds": 60},
            {"runWhen": "idle", "priority": 0},
        )
    )
    await asyncio.sleep(0)

    assert task_writer.done() is False

    release_read.set()
    assert await reader == "ready"
    await task_writer
    assert await pipeline_db.get_task_schedule("task:queued-behind-read:stale") is not None


@pytest.mark.asyncio
async def test_expired_cache_cleanup_cannot_delete_concurrent_refresh(pipeline_db, monkeypatch):
    await pipeline_db.cache_set("cache-race", "expired", ttl_seconds=-1)
    delete_reached = asyncio.Event()
    release_delete = asyncio.Event()
    original_execute = pipeline_db.conn.execute

    async def pause_before_delete(sql, *args, **kwargs):
        if sql == "DELETE FROM cache WHERE key = ?":
            delete_reached.set()
            await release_delete.wait()
        return await original_execute(sql, *args, **kwargs)

    monkeypatch.setattr(pipeline_db.conn, "execute", pause_before_delete)
    expired_reader = asyncio.create_task(pipeline_db.cache_get("cache-race"))
    await delete_reached.wait()
    refresher = asyncio.create_task(pipeline_db.cache_set("cache-race", "fresh", ttl_seconds=300))
    await asyncio.sleep(0)

    assert refresher.done() is False

    release_delete.set()
    assert await expired_reader is None
    await refresher
    assert await pipeline_db.cache_get("cache-race") == "fresh"


@pytest.mark.asyncio
async def test_unified_http_survives_expired_cache_cleanup_during_task_write(pipeline_db, monkeypatch):
    await pipeline_db.upsert_security(
        "PIPE.EU",
        name="Pipeline",
        currency="EUR",
        active=True,
        data='{"mrkt": {"mkt_id": 1}}',
    )
    await pipeline_db.cache_set("planner:http-probe", "expired", ttl_seconds=-1)

    broker = MagicMock()
    broker.get_market_status = AsyncMock(return_value={"m": [{"i": 1, "s": "OPEN"}]})
    broker.get_quotes = AsyncMock(return_value={})
    settings = MagicMock()
    settings.get = AsyncMock(return_value=None)
    currency = MagicMock()
    currency.to_eur = AsyncMock(side_effect=lambda amount, _currency: amount)
    deps = CommonDependencies(db=pipeline_db, settings=settings, broker=broker, currency=currency)

    planner = MagicMock()

    async def recommendations_from_expired_cache(**_kwargs):
        await pipeline_db.cache_get("planner:http-probe")
        return []

    planner.get_recommendations = AsyncMock(side_effect=recommendations_from_expired_cache)
    planner.calculate_ideal_portfolio = AsyncMock(return_value={})
    planner.get_current_allocations = AsyncMock(return_value={})
    planner.get_last_allocation_diagnostics.return_value = {}

    delete_reached = asyncio.Event()
    release_delete = asyncio.Event()
    original_execute = pipeline_db.conn.execute

    async def pause_expired_delete(sql, *args, **kwargs):
        if sql == "DELETE FROM cache WHERE key = ?":
            delete_reached.set()
            await release_delete.wait()
        return await original_execute(sql, *args, **kwargs)

    monkeypatch.setattr(pipeline_db.conn, "execute", pause_expired_delete)

    app = FastAPI()
    app.include_router(unified_router, prefix="/api")

    async def dependency_override():
        return deps

    app.dependency_overrides[get_common_deps] = dependency_override
    transport = httpx.ASGITransport(app=app)

    with patch("sentinel.planner.Planner", return_value=planner):
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            request = asyncio.create_task(client.get("/api/unified?period=1Y"))
            await asyncio.wait_for(delete_reached.wait(), timeout=2)
            task_writer = asyncio.create_task(
                pipeline_db.upsert_task_schedule(
                    "task:http-probe:stale",
                    "http-probe",
                    {"type": "stale_after", "seconds": 60},
                    {"runWhen": "idle", "priority": 0},
                )
            )
            await asyncio.sleep(0)
            assert task_writer.done() is False

            release_delete.set()
            response = await request
            await task_writer

    assert response.status_code == 200
    assert response.json()[0]["symbol"] == "PIPE.EU"


@pytest.mark.asyncio
async def test_simulation_initialization_uses_serialized_reference_snapshot(pipeline_db):
    await pipeline_db.set_setting("simulation-probe", {"enabled": True})
    await pipeline_db.upsert_security("PIPE.EU", name="Pipeline", currency="EUR", active=True)
    await pipeline_db.save_prices(
        "PIPE.EU",
        [{"date": "2026-08-29", "open": 9.0, "high": 11.0, "low": 8.0, "close": 10.0, "volume": 100}],
    )

    simulation = SimulationDatabase()
    try:
        await simulation.initialize_from(pipeline_db)

        setting = await (
            await simulation.conn.execute("SELECT value FROM settings WHERE key = ?", ("simulation-probe",))
        ).fetchone()
        assert setting["value"] == '{"enabled": true}'
        assert (await simulation.get_security("PIPE.EU"))["name"] == "Pipeline"
        assert (await simulation.get_prices("PIPE.EU"))[0]["close"] == 10.0
    finally:
        await simulation.close()
