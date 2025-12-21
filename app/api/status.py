"""System status API endpoints."""

from datetime import datetime
from fastapi import APIRouter, Depends
import aiosqlite
from app.database import get_db
from app.config import settings

router = APIRouter()


@router.get("")
async def get_status(db: aiosqlite.Connection = Depends(get_db)):
    """Get system health and status."""
    # Get last sync time
    cursor = await db.execute("""
        SELECT date FROM portfolio_snapshots ORDER BY date DESC LIMIT 1
    """)
    row = await cursor.fetchone()
    last_sync = row["date"] if row else None

    # Get stock count
    cursor = await db.execute("SELECT COUNT(*) as count FROM stocks WHERE active = 1")
    stock_count = (await cursor.fetchone())["count"]

    # Get position count
    cursor = await db.execute("SELECT COUNT(*) as count FROM positions")
    position_count = (await cursor.fetchone())["count"]

    # Calculate next rebalance date
    today = datetime.now()
    if today.day >= settings.monthly_rebalance_day:
        # Next month
        if today.month == 12:
            next_rebalance = datetime(today.year + 1, 1, settings.monthly_rebalance_day)
        else:
            next_rebalance = datetime(today.year, today.month + 1, settings.monthly_rebalance_day)
    else:
        next_rebalance = datetime(today.year, today.month, settings.monthly_rebalance_day)

    return {
        "status": "healthy",
        "last_sync": last_sync,
        "next_rebalance": next_rebalance.isoformat(),
        "stock_universe_count": stock_count,
        "active_positions": position_count,
        "monthly_deposit": settings.monthly_deposit,
    }


@router.get("/led")
async def get_led_status():
    """Get current LED matrix state."""
    from app.led.display import get_led_display

    display = get_led_display()
    state = display.get_state()

    return {
        "connected": display.is_connected,
        "mode": state.mode.value if state else "disconnected",
        "allocation": {
            "eu": state.geo_eu if state else 0,
            "asia": state.geo_asia if state else 0,
            "us": state.geo_us if state else 0,
        } if state else None,
        "system_status": state.system_status if state else "unknown",
    }


@router.post("/led/connect")
async def connect_led():
    """Attempt to connect to LED display."""
    from app.led.display import get_led_display

    display = get_led_display()
    success = display.connect()

    return {
        "connected": success,
        "message": "Connected to LED display" if success else "Failed to connect",
    }


@router.post("/led/test")
async def test_led():
    """Test LED display with success animation."""
    from app.led.display import get_led_display

    display = get_led_display()
    if not display.is_connected:
        display.connect()

    if display.is_connected:
        display.show_success()
        return {"status": "success", "message": "Test animation sent"}

    return {"status": "error", "message": "LED display not connected"}


@router.post("/sync/portfolio")
async def trigger_portfolio_sync():
    """Manually trigger portfolio sync."""
    from app.jobs.daily_sync import sync_portfolio

    try:
        await sync_portfolio()
        return {"status": "success", "message": "Portfolio sync completed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/sync/prices")
async def trigger_price_sync():
    """Manually trigger price sync."""
    from app.jobs.daily_sync import sync_prices

    try:
        await sync_prices()
        return {"status": "success", "message": "Price sync completed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/tradernet")
async def get_tradernet_status():
    """Get Tradernet connection status."""
    from app.services.tradernet import get_tradernet_client

    client = get_tradernet_client()
    return {
        "connected": client.is_connected,
        "message": "Connected to Tradernet" if client.is_connected else "Not connected",
    }
