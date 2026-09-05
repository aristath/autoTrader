"""Tests for Sentinel's MCP transport adapter."""

from __future__ import annotations

from contextlib import asynccontextmanager
from types import SimpleNamespace
from unittest.mock import AsyncMock

import httpx2
import pytest
from fastapi import HTTPException
from mcp import Client
from mcp.client.streamable_http import streamable_http_client

import sentinel.app as app_module
import sentinel.mcp_server as server

app = app_module.app

EXPECTED_TOOLS = {
    "sentinel_status",
    "portfolio_get",
    "portfolio_composition_get",
    "portfolio_structure_get",
    "portfolio_performance_get",
    "portfolio_period_stats_get",
    "portfolio_projection_get",
    "portfolio_sync",
    "portfolio_cagr_get",
    "securities_overview_get",
    "securities_list",
    "security_get",
    "security_prices_get",
    "security_aliases_get",
    "security_ai_preference_update",
    "security_prices_sync",
    "security_prices_sync_all",
    "security_add",
    "security_update",
    "security_remove",
    "plan_get",
    "ideal_portfolio_get",
    "plan_summary_get",
    "trades_get",
    "cashflows_get",
    "trades_sync",
    "cashflows_sync",
    "markets_get",
    "cache_stats_get",
    "cache_clear",
    "exchange_rates_get",
    "exchange_rates_sync",
    "exchange_rate_set",
    "categories_get",
    "pulse_labels_get",
    "led_status_get",
    "led_enabled_set",
    "led_refresh",
    "led_bridge_health_get",
    "led_bridge_health_update",
    "settings_get",
    "setting_set",
    "strategy_settings_set",
    "jobs_get",
    "job_schedules_get",
    "job_history_get",
    "job_run",
    "job_schedule_update",
    "jobs_reschedule_all",
    "tasks_list",
    "task_get",
    "task_create",
    "task_save",
    "task_meta_update",
    "task_delete",
    "task_validate",
    "task_files_list",
    "task_file_get",
    "task_file_save",
    "task_file_delete",
    "task_run",
    "tasks_schedule",
    "task_runs_get",
    "task_run_get",
    "task_run_stop",
    "ai_status_get",
    "ai_models_get",
    "ai_units_get",
    "ai_history_get",
    "ai_artifact_get",
    "ai_research_run",
    "memories_get",
    "memory_store",
    "forecast_status_get",
    "forecast_get",
    "security_buy",
    "security_sell",
    "backup_status_get",
    "backup_run",
}


def strategy_values() -> dict[str, float]:
    return {
        "strategy_min_opp_score": 0.6,
        "strategy_ideal_qualifying_threshold": 0.65,
        "strategy_core_timing_min_score": 0.3,
        "strategy_core_timing_min_dip_score": 0.2,
        "strategy_fallback_wait_days": 30.0,
        "strategy_entry_t1_dd": -0.10,
        "strategy_entry_t2_dd": -0.16,
        "strategy_entry_t3_dd": -0.22,
        "strategy_entry_memory_days": 45.0,
        "strategy_memory_max_boost": 0.12,
        "strategy_opportunity_addon_threshold": 0.75,
        "strategy_max_opportunity_buys_per_cycle": 1.0,
        "strategy_max_new_opportunity_buys_per_cycle": 1.0,
    }


@pytest.mark.asyncio
async def test_mcp_lists_the_complete_sentinel_tool_surface():
    async with Client(server.mcp) as client:
        result = await client.list_tools()

    assert {tool.name for tool in result.tools} == EXPECTED_TOOLS
    assert all(tool.description for tool in result.tools)


def test_mcp_is_mounted_before_the_spa_catch_all():
    paths = [route.path for route in app.routes]
    assert "/mcp" in paths
    assert paths.index("/mcp") < paths.index("/{path:path}")


@pytest.mark.asyncio
async def test_setting_set_calls_existing_settings_operation(monkeypatch):
    deps = SimpleNamespace()
    seen = {}

    async def fake_deps():
        return deps

    async def fake_set_setting(key, payload, actual_deps):
        seen.update(key=key, payload=payload, deps=actual_deps)
        return {"status": "ok"}

    monkeypatch.setattr(server, "_deps", fake_deps)
    monkeypatch.setattr(server.settings_api, "set_setting", fake_set_setting)

    async with Client(server.mcp) as client:
        result = await client.call_tool("setting_set", {"key": "trading_mode", "value": "research"})

    assert result.is_error is False
    assert result.structured_content == {"status": "ok"}
    assert seen == {
        "key": "trading_mode",
        "payload": {"value": "research"},
        "deps": deps,
    }


@pytest.mark.asyncio
async def test_setting_set_rejects_individual_strategy_setting(monkeypatch):
    async def unexpected_call(*_args, **_kwargs):
        pytest.fail("protected strategy setting reached the single-setting operation")

    monkeypatch.setattr(server.settings_api, "set_setting", unexpected_call)

    async with Client(server.mcp) as client:
        result = await client.call_tool(
            "setting_set",
            {"key": "strategy_min_opp_score", "value": 0.7},
        )

    assert result.is_error is True
    assert "Strategy settings must be updated together" in result.content[0].text


@pytest.mark.asyncio
async def test_strategy_settings_set_calls_atomic_settings_operation(monkeypatch):
    deps = SimpleNamespace()
    seen = {}
    values = strategy_values()

    async def fake_deps():
        return deps

    async def fake_set_settings_batch(payload, actual_deps):
        seen.update(payload=payload, deps=actual_deps)
        return {"status": "ok"}

    monkeypatch.setattr(server, "_deps", fake_deps)
    monkeypatch.setattr(server.settings_api, "set_settings_batch", fake_set_settings_batch)

    async with Client(server.mcp) as client:
        result = await client.call_tool("strategy_settings_set", {"values": values})

    assert result.is_error is False
    assert result.structured_content == {"status": "ok"}
    assert seen == {"payload": {"values": values}, "deps": deps}


@pytest.mark.asyncio
async def test_strategy_settings_set_does_not_coerce_boolean_to_number(monkeypatch):
    async def unexpected_call(*_args, **_kwargs):
        pytest.fail("invalid strategy settings reached the batch operation")

    monkeypatch.setattr(server.settings_api, "set_settings_batch", unexpected_call)
    values = strategy_values()
    values["strategy_min_opp_score"] = True

    async with Client(server.mcp) as client:
        result = await client.call_tool("strategy_settings_set", {"values": values})

    assert result.is_error is True


@pytest.mark.asyncio
async def test_http_validation_error_becomes_mcp_tool_error(monkeypatch):
    async def reject(_job_type):
        raise HTTPException(status_code=404, detail="Unknown job type: nope")

    monkeypatch.setattr(server.jobs_api, "run_job_endpoint", reject)

    async with Client(server.mcp) as client:
        result = await client.call_tool("job_run", {"job_type": "nope"})

    assert result.is_error is True
    assert "Unknown job type: nope" in result.content[0].text


@pytest.mark.asyncio
async def test_domain_validation_error_becomes_mcp_tool_error(monkeypatch):
    async def reject(_symbol, _quantity):
        raise ValueError("Live trading is disabled in research mode")

    monkeypatch.setattr(server.trading_api, "buy_security", reject)

    async with Client(server.mcp) as client:
        result = await client.call_tool("security_buy", {"symbol": "TEST.EU", "quantity": 1})

    assert result.is_error is True
    assert "Live trading is disabled in research mode" in result.content[0].text


@pytest.mark.asyncio
async def test_runtime_operation_error_becomes_mcp_tool_error(monkeypatch):
    async def reject(_symbol, _days):
        raise RuntimeError("Broker returned no usable prices")

    monkeypatch.setattr(server.securities_api, "sync_prices", reject)

    async with Client(server.mcp) as client:
        result = await client.call_tool("security_prices_sync", {"symbol": "TEST.EU", "days": 365})

    assert result.is_error is True
    assert "Broker returned no usable prices" in result.content[0].text


@pytest.mark.asyncio
async def test_exchange_rate_schema_rejects_non_positive_rate(monkeypatch):
    async def unexpected_call(*_args, **_kwargs):
        pytest.fail("invalid exchange rate reached the application operation")

    monkeypatch.setattr(server.system_api, "set_exchange_rate", unexpected_call)

    async with Client(server.mcp) as client:
        result = await client.call_tool("exchange_rate_set", {"currency": "USD", "rate": -0.5})

    assert result.is_error is True


@pytest.mark.asyncio
async def test_mutation_tools_publish_explicit_closed_schemas():
    async with Client(server.mcp) as client:
        result = await client.list_tools()

    schemas = {tool.name: tool.input_schema for tool in result.tools}
    expected = {
        "security_update": (
            "SecurityChanges",
            {"aliases", "allow_buy", "allow_sell", "ai_research_multiplier", "ai_research_multiplier_analysis"},
        ),
        "job_schedule_update": (
            "JobScheduleChanges",
            {"interval_minutes", "interval_market_open_minutes", "market_timing"},
        ),
        "task_meta_update": (
            "TaskMetadataChanges",
            {"name", "description", "tags", "enabled", "schedule", "cwd", "statePath", "timeout", "schedulePolicy"},
        ),
    }
    for tool_name, (definition_name, properties) in expected.items():
        definition = schemas[tool_name]["$defs"][definition_name]
        assert definition["additionalProperties"] is False
        assert set(definition["properties"]) == properties


@pytest.mark.asyncio
async def test_task_metadata_schema_preserves_api_field_names(monkeypatch):
    seen = {}

    async def fake_task_meta_save(task_id, changes):
        seen.update(task_id=task_id, changes=changes)
        return {"id": task_id, **changes}

    monkeypatch.setattr(server.tasks_api, "task_meta_save", fake_task_meta_save)

    async with Client(server.mcp) as client:
        result = await client.call_tool(
            "task_meta_update",
            {
                "task_id": "daily-research",
                "changes": {
                    "statePath": "state.json",
                    "schedulePolicy": {"runWhen": "idle", "priority": 2},
                },
            },
        )

    assert result.is_error is False
    assert seen == {
        "task_id": "daily-research",
        "changes": {
            "statePath": "state.json",
            "schedulePolicy": {"runWhen": "idle", "priority": 2.0},
        },
    }


@pytest.mark.asyncio
async def test_tasks_schedule_forwards_batch_and_delayed_fields(monkeypatch):
    enqueue = AsyncMock(return_value={"items": [{"id": "run-1"}, {"id": "run-2"}]})
    monkeypatch.setattr(server.tasks_api, "scheduler_enqueue", enqueue)

    async with Client(server.mcp) as client:
        result = await client.call_tool(
            "tasks_schedule",
            {
                "items": [
                    {"task": "analyze-security", "inputs": {"symbol": "AIR.EU"}},
                    {
                        "task": "rate-portfolio",
                        "title": "Later portfolio rating",
                        "dedupe_key": "rate-portfolio-2026-09-04",
                        "priority": 4,
                        "eligible_at": 1_788_480_000,
                    },
                ]
            },
        )

    assert result.is_error is False
    enqueue.assert_awaited_once_with(
        [
            {"task": "analyze-security", "inputs": {"symbol": "AIR.EU"}},
            {
                "task": "rate-portfolio",
                "title": "Later portfolio rating",
                "dedupe_key": "rate-portfolio-2026-09-04",
                "priority": 4,
                "eligible_at": 1_788_480_000.0,
            },
        ]
    )


@pytest.mark.asyncio
async def test_added_tools_delegate_to_existing_sentinel_operations(monkeypatch):
    deps = SimpleNamespace()

    async def fake_deps():
        return deps

    monkeypatch.setattr(server, "_deps", fake_deps)

    operations = {
        "portfolio_sync": (server.portfolio_api, "sync_portfolio", {"status": "ok"}),
        "portfolio_cagr": (server.portfolio_api, "get_portfolio_cagr", {"cagr": 4.2}),
        "aliases": (server.securities_api, "get_all_aliases", [{"symbol": "AIR.EU"}]),
        "preference": (server.securities_api, "update_security_preference", {"symbol": "AIR.EU"}),
        "prices": (server.securities_api, "sync_prices", {"synced": 42}),
        "prices_all": (server.securities_api, "sync_all_prices", {"status": "ok"}),
        "trades": (server.trading_api, "sync_trades_endpoint", {"status": "ok"}),
        "cashflows": (server.trading_api, "sync_cashflows_endpoint", {"status": "ok"}),
        "cache_stats": (server.system_api, "get_cache_stats", {"motion": {"size": 1}}),
        "cache_clear": (server.system_api, "clear_cache", {"cleared": {}}),
        "rates": (server.system_api, "get_exchange_rates", {"USD": 0.85}),
        "rates_sync": (server.system_api, "sync_exchange_rates", {"USD": 0.85}),
        "rate_set": (server.system_api, "set_exchange_rate", {"status": "ok"}),
        "categories": (server.system_api, "get_categories", {"industries": []}),
        "pulse": (server.system_api, "get_pulse_labels", {"industries": []}),
        "led_status": (server.settings_api, "get_led_status", {"enabled": True}),
        "led_enabled": (server.settings_api, "set_led_enabled", {"enabled": False}),
        "led_refresh": (server.settings_api, "refresh_led_display", {"status": "refreshed"}),
        "led_bridge_get": (server.settings_api, "get_led_bridge_health", {"bridge_ok": True}),
        "led_bridge_set": (server.settings_api, "set_led_bridge_health", {"bridge_ok": True}),
        "ai_models": (server.ai_api, "get_ai_models", {"ok": True, "models": []}),
        "memories": (server.memory_api, "memories", {"items": []}),
        "memory_store": (server.memory_api, "dedup_store", {"stored": True}),
    }
    mocks = {}
    for key, (module, name, return_value) in operations.items():
        mock = AsyncMock(return_value=return_value)
        monkeypatch.setattr(module, name, mock)
        mocks[key] = mock

    calls = [
        ("portfolio_sync", {}),
        ("portfolio_cagr_get", {}),
        ("security_aliases_get", {}),
        (
            "security_ai_preference_update",
            {"symbol": "AIR.EU", "ai_research_multiplier": 0.8, "analysis": "Strong evidence"},
        ),
        ("security_prices_sync", {"symbol": "AIR.EU", "days": 730}),
        ("security_prices_sync_all", {}),
        ("trades_sync", {}),
        ("cashflows_sync", {}),
        ("cache_stats_get", {}),
        ("cache_clear", {"name": "planner"}),
        ("exchange_rates_get", {}),
        ("exchange_rates_sync", {}),
        ("exchange_rate_set", {"currency": "USD", "rate": 0.85}),
        ("categories_get", {}),
        ("pulse_labels_get", {}),
        ("led_status_get", {}),
        ("led_enabled_set", {"enabled": False}),
        ("led_refresh", {}),
        ("led_bridge_health_get", {}),
        ("led_bridge_health_update", {"changes": {"bridge_ok": True, "consecutive_failures": 0}}),
        ("ai_models_get", {}),
        ("memories_get", {"tag": "portfolio", "limit": 20, "offset": 5}),
        ("memory_store", {"memory": "A durable finding", "tags": ["portfolio"]}),
    ]

    async with Client(server.mcp) as client:
        results = [await client.call_tool(name, arguments) for name, arguments in calls]

    assert all(result.is_error is False for result in results)
    mocks["portfolio_sync"].assert_awaited_once_with()
    mocks["portfolio_cagr"].assert_awaited_once_with(deps)
    mocks["aliases"].assert_awaited_once_with(deps)
    mocks["preference"].assert_awaited_once_with(
        {"symbol": "AIR.EU", "ai_research_multiplier": 0.8, "analysis": "Strong evidence"},
        deps,
    )
    mocks["prices"].assert_awaited_once_with("AIR.EU", 730)
    mocks["prices_all"].assert_awaited_once_with(deps)
    mocks["trades"].assert_awaited_once_with()
    mocks["cashflows"].assert_awaited_once_with()
    mocks["cache_stats"].assert_awaited_once_with()
    mocks["cache_clear"].assert_awaited_once_with(deps, "planner")
    mocks["rates"].assert_awaited_once_with()
    mocks["rates_sync"].assert_awaited_once_with()
    mocks["rate_set"].assert_awaited_once_with("USD", {"rate": 0.85})
    mocks["categories"].assert_awaited_once_with(deps)
    mocks["pulse"].assert_awaited_once_with(deps)
    mocks["led_status"].assert_awaited_once_with()
    mocks["led_enabled"].assert_awaited_once_with({"enabled": False})
    mocks["led_refresh"].assert_awaited_once_with()
    mocks["led_bridge_get"].assert_awaited_once_with()
    mocks["led_bridge_set"].assert_awaited_once_with({"bridge_ok": True, "consecutive_failures": 0})
    mocks["ai_models"].assert_awaited_once_with(deps)
    mocks["memories"].assert_awaited_once_with(deps, "portfolio", 20, 5, None)
    mocks["memory_store"].assert_awaited_once_with(
        {"memory": "A durable finding", "tags": ["portfolio"], "metadata": None},
        deps,
    )


@pytest.mark.asyncio
async def test_mounted_streamable_http_transport_negotiates_on_both_documented_urls(monkeypatch):
    @asynccontextmanager
    async def no_services(_app):
        yield

    monkeypatch.setattr(app_module, "_sentinel_lifespan", no_services)

    async with app.router.lifespan_context(app):
        async with httpx2.AsyncClient(
            transport=httpx2.ASGITransport(app=app),
            base_url="http://sentinel.test",
            follow_redirects=False,
        ) as http_client:
            for url in ("http://sentinel.test/mcp", "http://sentinel.test/mcp/"):
                transport = streamable_http_client(url, http_client=http_client)
                async with Client(transport) as client:
                    result = await client.list_tools()
                assert {tool.name for tool in result.tools} == EXPECTED_TOOLS
