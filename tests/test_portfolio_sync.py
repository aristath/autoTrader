"""Tests for portfolio synchronization side effects."""

import os
import sqlite3
import tempfile
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio

from sentinel.database import Database
from sentinel.portfolio import Portfolio
from sentinel.universe import BROKER_POSITION_UNIVERSE_SOURCE


@pytest_asyncio.fixture
async def temp_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    db = Database(path)
    await db.connect()

    yield db

    await db.close()
    db.remove_from_cache()
    for ext in ("", "-wal", "-shm"):
        target = path + ext
        if os.path.exists(target):
            os.unlink(target)


def _broker_with_position(symbol: str):
    broker = AsyncMock()
    broker.get_portfolio = AsyncMock(
        return_value={
            "positions": [
                {
                    "symbol": symbol,
                    "name": f"{symbol} Holding",
                    "quantity": 2,
                    "current_price": 100.0,
                    "currency": "EUR",
                }
            ],
            "cash": {},
        }
    )
    broker.get_security_info = AsyncMock(
        return_value={
            "short_name": f"{symbol} Corp",
            "currency": "EUR",
            "mrkt": {"mkt_id": 123},
            "lot": "1.00000000",
        }
    )
    broker.get_historical_prices_bulk = AsyncMock(return_value={symbol: [{"date": "2026-01-01", "close": 100.0}]})
    return broker


@pytest.mark.asyncio
async def test_sync_fully_imports_new_held_security(temp_db):
    broker = _broker_with_position("NEW.EU")
    portfolio = Portfolio(db=temp_db, broker=broker)

    await portfolio.sync()

    row = await temp_db.get_security("NEW.EU")
    prices = await temp_db.get_prices("NEW.EU", days=10)
    position = await temp_db.get_position("NEW.EU")
    assert row is not None
    assert int(row["active"]) == 1
    assert int(row["allow_buy"]) == 1
    assert int(row["allow_sell"]) == 1
    assert row["universe_source"] == BROKER_POSITION_UNIVERSE_SOURCE
    assert row["market_id"] == "123"
    assert row["data"] is not None
    assert len(prices) == 1
    assert position is not None
    assert position["quantity"] == 2
    broker.get_security_info.assert_awaited_once_with("NEW.EU")
    broker.get_historical_prices_bulk.assert_awaited_once_with(["NEW.EU"], years=20)


@pytest.mark.asyncio
async def test_sync_self_heals_when_metadata_is_temporarily_unavailable(temp_db):
    broker = _broker_with_position("BROKEN.EU")
    broker.get_security_info = AsyncMock(return_value=None)
    broker.get_historical_prices_bulk = AsyncMock(return_value={})
    portfolio = Portfolio(db=temp_db, broker=broker)

    await portfolio.sync()

    row = await temp_db.get_security("BROKEN.EU")
    prices = await temp_db.get_prices("BROKEN.EU", days=10)
    position = await temp_db.get_position("BROKEN.EU")
    assert row is not None
    assert int(row["active"]) == 1
    assert int(row["allow_buy"]) == 1
    assert int(row["allow_sell"]) == 1
    assert row["name"] == "BROKEN.EU Holding"
    assert row["currency"] == "EUR"
    assert row["universe_source"] == BROKER_POSITION_UNIVERSE_SOURCE
    assert row["data"] is None
    assert prices == []
    assert position is not None
    assert position["quantity"] == 2


@pytest.mark.asyncio
async def test_sync_preserves_positions_and_cash_when_broker_fetch_fails(temp_db):
    await temp_db.upsert_security("KEEP.EU", name="Keep", currency="EUR", active=1)
    await temp_db.upsert_position("KEEP.EU", quantity=7, current_price=12.0, currency="EUR")
    await temp_db.set_cash_balances({"EUR": 345.0})
    broker = AsyncMock()
    broker.get_portfolio = AsyncMock(side_effect=RuntimeError("broker unavailable"))
    portfolio = Portfolio(db=temp_db, broker=broker)

    with pytest.raises(RuntimeError, match="broker unavailable"):
        await portfolio.sync()

    position = await temp_db.get_position("KEEP.EU")
    assert position is not None
    assert position["quantity"] == 7
    assert await temp_db.get_cash_balances() == {"EUR": 345.0}
    broker.get_portfolio.assert_awaited_once_with(raise_on_error=True)


@pytest.mark.asyncio
async def test_portfolio_state_replacement_rolls_back_positions_and_cash_together(temp_db):
    await temp_db.upsert_security("KEEP.EU", name="Keep", currency="EUR", active=1)
    await temp_db.upsert_position("KEEP.EU", quantity=7, current_price=12.0, currency="EUR")
    await temp_db.set_cash_balances({"EUR": 345.0})

    with pytest.raises(sqlite3.IntegrityError):
        await temp_db.replace_portfolio_state(
            [{"symbol": "KEEP.EU", "quantity": 2, "current_price": 99.0, "currency": "EUR"}],
            {"EUR": None},  # type: ignore[dict-item]
        )

    position = await temp_db.get_position("KEEP.EU")
    assert position is not None
    assert position["quantity"] == 7
    assert position["current_price"] == 12.0
    assert await temp_db.get_cash_balances() == {"EUR": 345.0}


@pytest.mark.asyncio
async def test_sync_replaces_positions_and_cash_as_one_snapshot(temp_db):
    await temp_db.upsert_security("OLD.EU", name="Old", currency="EUR", active=1)
    await temp_db.upsert_security("KEEP.EU", name="Keep", currency="EUR", active=1)
    await temp_db.upsert_position("OLD.EU", quantity=7, current_price=12.0, currency="EUR")
    await temp_db.set_cash_balances({"EUR": 345.0})
    broker = AsyncMock()
    broker.get_portfolio.return_value = {
        "positions": [{"symbol": "KEEP.EU", "quantity": 2, "current_price": 99.0, "currency": "EUR"}],
        "cash": {"USD": 25.0},
    }

    portfolio = Portfolio(db=temp_db, broker=broker)
    await portfolio.sync()

    old_position = await temp_db.get_position("OLD.EU")
    kept_position = await temp_db.get_position("KEEP.EU")
    assert old_position is not None and old_position["quantity"] == 0
    assert kept_position is not None and kept_position["quantity"] == 2
    assert kept_position["current_price"] == 99.0
    assert await temp_db.get_cash_balances() == {"USD": 25.0}


@pytest.mark.asyncio
async def test_missing_price_sync_fails_when_broker_returns_no_data():
    from sentinel.app import _sync_missing_prices

    db = AsyncMock()
    db.get_all_positions.return_value = [{"symbol": "KEEP.EU"}]
    db.get_price_count.return_value = 0
    broker = AsyncMock()
    broker.get_historical_prices_bulk.return_value = {}

    with pytest.raises(RuntimeError, match="no usable prices"):
        await _sync_missing_prices(db, broker)

    broker.get_historical_prices_bulk.assert_awaited_once_with(
        ["KEEP.EU"],
        years=10,
        raise_on_error=True,
    )
    db.save_prices.assert_not_awaited()


@pytest.mark.asyncio
async def test_missing_price_sync_reports_every_symbol_without_data():
    from sentinel.app import _sync_missing_prices

    db = AsyncMock()
    db.get_all_positions.return_value = [{"symbol": "GOOD.EU"}, {"symbol": "MISSING.EU"}]
    db.get_price_count.return_value = 0
    prices = [{"date": "2026-01-01", "close": 100.0}]
    broker = AsyncMock()
    broker.get_historical_prices_bulk.return_value = {"GOOD.EU": prices}

    with pytest.raises(RuntimeError, match="MISSING.EU"):
        await _sync_missing_prices(db, broker)

    db.save_prices.assert_awaited_once_with("GOOD.EU", prices)
