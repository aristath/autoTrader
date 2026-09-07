"""Model Context Protocol interface for Sentinel.

The MCP server is deliberately an adapter over Sentinel's existing application
operations.  It does not maintain separate state or duplicate portfolio,
trading, scheduling, task, or research rules.
"""

from __future__ import annotations

from typing import Any, Awaitable, TypeVar

from fastapi import HTTPException
from mcp.server import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.server.transport_security import TransportSecuritySettings

from sentinel.api.dependencies import CommonDependencies, get_common_deps
from sentinel.api.routers import ai as ai_api
from sentinel.api.routers import backup as backup_api
from sentinel.api.routers import forecasts as forecasts_api
from sentinel.api.routers import jobs as jobs_api
from sentinel.api.routers import memory as memory_api
from sentinel.api.routers import planner as planner_api
from sentinel.api.routers import portfolio as portfolio_api
from sentinel.api.routers import securities as securities_api
from sentinel.api.routers import settings as settings_api
from sentinel.api.routers import system as system_api
from sentinel.api.routers import tasks as tasks_api
from sentinel.api.routers import trading as trading_api
from sentinel.version import VERSION

T = TypeVar("T")


mcp = MCPServer(
    name="sentinel",
    title="Sentinel",
    description="Read and control the Sentinel portfolio management system.",
    version=VERSION,
    instructions=(
        "Use these tools to inspect and operate Sentinel. Mutating tools use the same "
        "validation, research/live mode, broker, scheduler, and task behavior as the web application."
    ),
)


async def _deps() -> CommonDependencies:
    """Return the singleton-backed dependencies used by the HTTP API."""
    return await get_common_deps()


async def _call(awaitable: Awaitable[T]) -> T:
    """Expose API validation failures as concise MCP tool errors."""
    try:
        return await awaitable
    except HTTPException as exc:
        raise ToolError(str(exc.detail)) from exc
    except (ValueError, RuntimeError) as exc:
        raise ToolError(str(exc)) from exc


@mcp.tool()
async def sentinel_status() -> dict[str, Any]:
    """Get Sentinel health, broker connection state, trading mode, and version."""
    deps = await _deps()
    return {**await system_api.health(deps), **await system_api.version()}


@mcp.tool()
async def portfolio_get() -> dict[str, Any]:
    """Get the current portfolio positions, cash, and total value."""
    return await portfolio_api.get_portfolio(await _deps())


@mcp.tool()
async def portfolio_composition_get() -> dict[str, Any]:
    """Get portfolio composition, risk, return, concentration, and allocation data."""
    return await portfolio_api.get_portfolio_composition(await _deps())


@mcp.tool()
async def portfolio_structure_get(force_refresh: bool = False) -> dict[str, Any]:
    """Get Freedom24 portfolio structure analysis and optionally refresh it."""
    return await _call(portfolio_api.get_portfolio_structure(force_refresh))


@mcp.tool()
async def portfolio_performance_get(period: str = "1Y") -> dict[str, Any]:
    """Get portfolio P/L history for 1Y, 5Y, 10Y, or ALL."""
    return await _call(portfolio_api.get_portfolio_pnl_history(await _deps(), period))


@mcp.tool()
async def portfolio_period_stats_get() -> dict[str, Any]:
    """Get current portfolio return statistics for every supported period."""
    return await portfolio_api.get_portfolio_period_stats(await _deps())


@mcp.tool()
async def portfolio_projection_get(
    years: int = 25,
    monthly_net_deposit_eur: float | None = None,
) -> dict[str, Any]:
    """Project portfolio value for a supported horizon, optionally overriding monthly deposits."""
    return await _call(
        portfolio_api.get_portfolio_value_projection(
            await _deps(),
            years,
            monthly_net_deposit_eur,
        )
    )


@mcp.tool()
async def portfolio_sync() -> dict[str, str]:
    """Synchronize the portfolio from the broker now."""
    return await _call(portfolio_api.sync_portfolio())


@mcp.tool()
async def portfolio_cagr_get() -> dict[str, Any]:
    """Get the lightweight since-inception portfolio CAGR calculation."""
    return await portfolio_api.get_portfolio_cagr(await _deps())


@mcp.tool()
async def securities_overview_get(
    period: str = "1Y",
    as_of: str | None = None,
    include_inactive: bool = False,
    inactive_only: bool = False,
) -> list[dict[str, Any]]:
    """Get the unified securities view with positions, prices, allocations, and plan data."""
    return await securities_api.get_unified_view(
        await _deps(),
        period,
        as_of,
        include_inactive,
        inactive_only,
    )


@mcp.tool()
async def securities_list() -> list[dict[str, Any]]:
    """List all active and inactive securities in Sentinel's universe."""
    return await securities_api.get_securities(await _deps())


@mcp.tool()
async def security_get(symbol: str) -> dict[str, Any]:
    """Get one security and its execution and AI-research settings."""
    return await _call(securities_api.get_security(symbol, await _deps()))


@mcp.tool()
async def security_prices_get(symbol: str, days: int = 365) -> list[dict[str, Any]]:
    """Get validated historical prices for a security."""
    return await securities_api.get_prices(symbol, days)


@mcp.tool()
async def security_aliases_get() -> list[dict[str, Any]]:
    """Get symbol, name, and aliases for every active security."""
    return await securities_api.get_all_aliases(await _deps())


@mcp.tool()
async def security_ai_preference_update(
    symbol: str,
    ai_research_multiplier: Any,
    analysis: Any,
) -> dict[str, Any]:
    """Store an AI-sourced research multiplier and its supporting analysis."""
    return await _call(
        securities_api.update_security_preference(
            {
                "symbol": symbol,
                "ai_research_multiplier": ai_research_multiplier,
                "analysis": analysis,
            },
            await _deps(),
        )
    )


@mcp.tool()
async def security_prices_sync(symbol: str, days: int = 365) -> dict[str, int]:
    """Synchronize historical prices for one security from the broker."""
    return await _call(securities_api.sync_prices(symbol, days))


@mcp.tool()
async def security_prices_sync_all() -> dict[str, str]:
    """Synchronize missing historical prices for all held securities."""
    return await _call(securities_api.sync_all_prices(await _deps()))


@mcp.tool()
async def security_add(symbol: str) -> dict[str, Any]:
    """Add or re-enable a broker security in Sentinel's universe."""
    return await _call(securities_api.add_security({"symbol": symbol}, await _deps()))


@mcp.tool()
async def security_update(symbol: str, changes: dict[str, Any]) -> dict[str, Any]:
    """Update a security's aliases, buy/sell controls, or AI research multiplier."""
    return await _call(
        securities_api.update_security(
            symbol,
            changes,
            await _deps(),
        )
    )


@mcp.tool()
async def security_remove(symbol: str) -> dict[str, Any]:
    """Apply Sentinel's safe universe-removal rules to a security."""
    return await _call(securities_api.delete_security(symbol, await _deps(), False))


@mcp.tool()
async def plan_get(minimum_trade_value_eur: float | None = None) -> dict[str, Any]:
    """Get current trade recommendations and the long-term portfolio plan."""
    return await planner_api.get_recommendations(await _deps(), minimum_trade_value_eur)


@mcp.tool()
async def ideal_portfolio_get() -> dict[str, Any]:
    """Get current and ideal portfolio allocations."""
    return await planner_api.get_ideal_portfolio(await _deps())


@mcp.tool()
async def plan_summary_get() -> dict[str, Any]:
    """Get the portfolio rebalance summary."""
    return await planner_api.get_rebalance_summary()


@mcp.tool()
async def trades_get(
    symbol: str | None = None,
    side: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> dict[str, Any]:
    """Get paginated trade history with optional symbol, side, and date filters."""
    return await trading_api.get_trades(
        await _deps(),
        symbol,
        side,
        start_date,
        end_date,
        limit,
        offset,
    )


@mcp.tool()
async def cashflows_get() -> dict[str, Any]:
    """Get deposits, withdrawals, dividends, taxes, fees, and total profit."""
    return await trading_api.get_cashflows(await _deps())


@mcp.tool()
async def trades_sync() -> dict[str, Any]:
    """Synchronize trade history from the broker now."""
    return await _call(trading_api.sync_trades_endpoint())


@mcp.tool()
async def cashflows_sync() -> dict[str, Any]:
    """Synchronize cash-flow history from the broker now."""
    return await _call(trading_api.sync_cashflows_endpoint())


@mcp.tool()
async def markets_get() -> dict[str, Any]:
    """Get open/closed state for markets represented in the active universe."""
    return await system_api.get_markets_status(await _deps())


@mcp.tool()
async def cache_stats_get() -> dict[str, Any]:
    """Get statistics for Sentinel's application caches."""
    return await system_api.get_cache_stats()


@mcp.tool()
async def cache_clear(name: str | None = None) -> dict[str, Any]:
    """Clear one named cache, or every cache when no name is supplied."""
    return await _call(system_api.clear_cache(await _deps(), name))


@mcp.tool()
async def exchange_rates_get() -> dict[str, Any]:
    """Get all stored exchange rates to EUR."""
    return await system_api.get_exchange_rates()


@mcp.tool()
async def exchange_rates_sync() -> dict[str, Any]:
    """Synchronize exchange rates from the broker now."""
    return await _call(system_api.sync_exchange_rates())


@mcp.tool()
async def exchange_rate_set(
    currency: str,
    rate: Any,
) -> dict[str, Any]:
    """Set one currency's exchange rate to EUR manually."""
    return await _call(system_api.set_exchange_rate(currency, {"rate": rate}))


@mcp.tool()
async def categories_get() -> dict[str, Any]:
    """Get distinct security categories in Sentinel's database."""
    return await system_api.get_categories(await _deps())


@mcp.tool()
async def pulse_labels_get() -> dict[str, Any]:
    """Get active geography and industry labels used by Pulse classification."""
    return await system_api.get_pulse_labels(await _deps())


@mcp.tool()
async def led_status_get() -> dict[str, Any]:
    """Get optional LED display state and bridge health."""
    return await settings_api.get_led_status()


@mcp.tool()
async def led_enabled_set(enabled: bool) -> dict[str, bool]:
    """Enable or disable the optional LED display."""
    return await _call(settings_api.set_led_enabled({"enabled": enabled}))


@mcp.tool()
async def led_refresh() -> dict[str, Any]:
    """Force an immediate refresh of the optional LED display."""
    return await _call(settings_api.refresh_led_display())


@mcp.tool()
async def led_bridge_health_get() -> dict[str, Any]:
    """Get the latest health report from the optional LED bridge."""
    return await settings_api.get_led_bridge_health()


@mcp.tool()
async def led_bridge_health_update(changes: dict[str, Any]) -> dict[str, Any]:
    """Store a health report from the optional LED bridge."""
    return await _call(settings_api.set_led_bridge_health(changes))


@mcp.tool()
async def settings_get() -> dict[str, Any]:
    """Get all Sentinel settings."""
    return await settings_api.get_settings(await _deps())


@mcp.tool()
async def setting_set(key: str, value: Any) -> dict[str, str]:
    """Set one Sentinel setting using the same storage and cache invalidation as the UI."""
    return await _call(settings_api.set_setting(key, {"value": value}, await _deps()))


@mcp.tool()
async def strategy_settings_set(values: dict[str, Any]) -> dict[str, str]:
    """Atomically validate and replace the complete strategy settings group."""
    return await _call(
        settings_api.set_settings_batch(
            {"values": values},
            await _deps(),
        )
    )


@mcp.tool()
async def jobs_get() -> dict[str, Any]:
    """Get the running job, upcoming jobs, and recent job activity."""
    return await jobs_api.get_jobs()


@mcp.tool()
async def job_schedules_get() -> dict[str, Any]:
    """Get all job schedules and their latest and next execution times."""
    return await jobs_api.get_job_schedules(await _deps())


@mcp.tool()
async def job_history_get(job_type: str | None = None, limit: int = 50) -> dict[str, Any]:
    """Get job execution history, optionally for one job type."""
    return await jobs_api.get_job_history(await _deps(), job_type, limit)


@mcp.tool()
async def job_run(job_type: str) -> dict[str, Any]:
    """Run a registered Sentinel job immediately."""
    return await _call(jobs_api.run_job_endpoint(job_type))


@mcp.tool()
async def job_schedule_update(job_type: str, schedule: dict[str, Any]) -> dict[str, Any]:
    """Update interval_minutes, interval_market_open_minutes, and/or market_timing for a job."""
    return await _call(
        jobs_api.update_job_schedule(
            job_type,
            schedule,
            await _deps(),
        )
    )


@mcp.tool()
async def jobs_reschedule_all() -> dict[str, Any]:
    """Make every registered job eligible again and reschedule it."""
    return await jobs_api.refresh_all(await _deps())


@mcp.tool()
async def tasks_list() -> list[dict[str, Any]]:
    """List editable Sentinel tasks."""
    return await tasks_api.tasks_list()


@mcp.tool()
async def task_get(task_id: str) -> dict[str, Any]:
    """Get an editable task definition."""
    return await _call(tasks_api.task_get(task_id))


@mcp.tool()
async def task_create(name: str) -> dict[str, Any]:
    """Create an editable Sentinel task."""
    return await _call(tasks_api.tasks_create({"name": name}))


@mcp.tool()
async def task_save(task_id: str, source: str) -> dict[str, Any]:
    """Replace an editable task's task.js source."""
    return await _call(tasks_api.task_save(task_id, {"markdown": source}))


@mcp.tool()
async def task_meta_update(task_id: str, changes: dict[str, Any]) -> dict[str, Any]:
    """Update editable task metadata and resync its schedule."""
    return await _call(
        tasks_api.task_meta_save(
            task_id,
            changes,
        )
    )


@mcp.tool()
async def task_delete(task_id: str) -> dict[str, str]:
    """Delete an editable task if it has no queued or running work."""
    await _call(tasks_api.task_delete(task_id))
    return {"status": "deleted", "task_id": task_id}


@mcp.tool()
async def task_validate(task_id: str) -> dict[str, Any]:
    """Validate an editable task definition."""
    return await _call(tasks_api.task_validate(task_id))


@mcp.tool()
async def task_files_list(task_id: str) -> list[dict[str, Any]]:
    """List files belonging to an editable task."""
    return await _call(tasks_api.task_files(task_id))


@mcp.tool()
async def task_file_get(task_id: str, name: str) -> dict[str, Any]:
    """Read one file belonging to an editable task."""
    return await _call(tasks_api.task_file_get(task_id, name))


@mcp.tool()
async def task_file_save(task_id: str, name: str, content: str, create: bool = False) -> dict[str, Any]:
    """Create or replace one file belonging to an editable task."""
    if create:
        return await _call(tasks_api.task_file_create(task_id, {"name": name, "content": content}))
    return await _call(tasks_api.task_file_save(task_id, name, {"content": content}))


@mcp.tool()
async def task_file_delete(task_id: str, name: str) -> dict[str, str]:
    """Delete one file belonging to an editable task."""
    await _call(tasks_api.task_file_delete(task_id, name))
    return {"status": "deleted", "task_id": task_id, "name": name}


@mcp.tool()
async def task_run(
    task_id: str,
    inputs: dict[str, Any] | None = None,
    run_mode: str | None = None,
) -> dict[str, Any]:
    """Queue an editable task with optional input values."""
    body: dict[str, Any] = {"inputs": inputs or {}}
    if run_mode is not None:
        body["runMode"] = run_mode
    return await _call(tasks_api.task_run(task_id, body))


@mcp.tool()
async def tasks_schedule(items: list[dict[str, Any]]) -> dict[str, Any]:
    """Queue one or more tasks, optionally with deduplication, priority, or delayed eligibility."""
    return await _call(tasks_api.scheduler_enqueue(items))


@mcp.tool()
async def task_runs_get(task_id: str, limit: int = 50) -> list[dict[str, Any]]:
    """Get recent executions of an editable task."""
    return await tasks_api.task_runs(task_id, limit)


@mcp.tool()
async def task_run_get(run_id: str) -> dict[str, Any]:
    """Get one task execution including its current output."""
    return await _call(tasks_api.task_run_get(run_id))


@mcp.tool()
async def task_run_stop(run_id: str) -> dict[str, Any]:
    """Stop a queued or running editable task execution."""
    return await _call(tasks_api.task_run_stop(run_id))


@mcp.tool()
async def ai_status_get() -> dict[str, Any]:
    """Get AI research pipeline status, queue, staleness, and last run."""
    return await ai_api.get_ai_status(await _deps())


@mcp.tool()
async def ai_models_get() -> dict[str, Any]:
    """Discover models available to Sentinel's configured AI service."""
    return await ai_api.get_ai_models(await _deps())


@mcp.tool()
async def ai_units_get(kind: str | None = None, stale_only: bool = False) -> dict[str, Any]:
    """List portfolio, macro, or security AI research units."""
    return await ai_api.get_ai_units(await _deps(), kind, stale_only)


@mcp.tool()
async def ai_history_get(limit: int = 50) -> dict[str, Any]:
    """Get completed and failed AI research pipeline runs."""
    return await ai_api.get_ai_history(await _deps(), limit)


@mcp.tool()
async def ai_artifact_get(kind: str, unit_key: str, name: str) -> dict[str, Any]:
    """Read an allowlisted AI research artifact for a unit."""
    return await _call(ai_api.get_ai_artifact(kind, unit_key, name, await _deps()))


@mcp.tool()
async def ai_research_run(kind: str, unit_kind: str, unit_key: str) -> dict[str, Any]:
    """Queue analyze or rate research for a security or macro unit."""
    return await _call(
        ai_api.create_ai_request(
            {"kind": kind, "unit_kind": unit_kind, "unit_key": unit_key},
            await _deps(),
        )
    )


@mcp.tool()
async def memories_get(
    tag: str = "",
    limit: int = 100,
    offset: int = 0,
    since: str | None = None,
) -> dict[str, Any]:
    """Read Sentinel AI memories, optionally filtered by tags and time."""
    return await memory_api.memories(await _deps(), tag, limit, offset, since)


@mcp.tool()
async def memory_store(
    memory: str,
    tags: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Store an AI memory through Sentinel's deduplicating memory operation."""
    return await _call(
        memory_api.dedup_store(
            {"memory": memory, "tags": tags, "metadata": metadata},
            await _deps(),
        )
    )


@mcp.tool()
async def forecast_status_get() -> dict[str, Any]:
    """Get forecasting configuration, service health, and recent run status."""
    return await forecasts_api.get_forecast_status(await _deps())


@mcp.tool()
async def forecast_get(symbol: str) -> dict[str, Any]:
    """Get the latest forecast path and evaluation for one security."""
    return await _call(forecasts_api.get_symbol_forecast(symbol, await _deps()))


@mcp.tool()
async def security_buy(symbol: str, quantity: int) -> dict[str, Any]:
    """Buy a security through Sentinel's existing trading path."""
    return await _call(trading_api.buy_security(symbol, quantity))


@mcp.tool()
async def security_sell(symbol: str, quantity: int) -> dict[str, Any]:
    """Sell a security through Sentinel's existing trading path."""
    return await _call(trading_api.sell_security(symbol, quantity))


@mcp.tool()
async def backup_status_get() -> dict[str, Any]:
    """Get R2 backup configuration state and available backups."""
    return await backup_api.get_backup_status(await _deps())


@mcp.tool()
async def backup_run() -> dict[str, Any]:
    """Run the configured R2 backup job now."""
    return await backup_api.run_backup()


mcp_app = mcp.streamable_http_app(
    streamable_http_path="/",
    transport_security=TransportSecuritySettings(enable_dns_rebinding_protection=False),
)
