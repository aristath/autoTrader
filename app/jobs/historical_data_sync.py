"""Historical data sync job for stock prices and portfolio reconstruction."""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, List

import aiosqlite

from app.config import settings
from app.services.tradernet import get_tradernet_client
from app.infrastructure.locking import file_lock

logger = logging.getLogger(__name__)

# Rate limiting: 3 requests per second = 0.33 seconds delay
RATE_LIMIT_DELAY = 0.33


async def sync_historical_data():
    """
    Sync all historical data: stock prices and portfolio reconstruction.
    
    This job:
    1. Fetches historical stock prices for all active stocks
    2. Reconstructs historical portfolio values from trades + prices
    
    Uses file locking to prevent concurrent runs.
    """
    async with file_lock("historical_data_sync", timeout=3600.0):  # 1 hour timeout
        await _sync_historical_data_internal()


async def _sync_historical_data_internal():
    """Internal historical data sync implementation."""
    logger.info("Starting historical data sync")
    
    try:
        # Part A: Sync stock price history
        await _sync_stock_price_history()
        
        # Part B: Reconstruct portfolio history
        await _reconstruct_portfolio_history()
        
        logger.info("Historical data sync complete")
    except Exception as e:
        logger.error(f"Historical data sync failed: {e}")
        raise


async def _sync_stock_price_history():
    """Part A: Fetch and store historical stock prices for all active stocks."""
    logger.info("Starting stock price history sync")
    
    client = get_tradernet_client()
    
    if not client.is_connected:
        if not client.connect():
            logger.error("Failed to connect to Tradernet, skipping stock price history sync")
            return
    
    async with aiosqlite.connect(settings.database_path) as db:
        db.row_factory = aiosqlite.Row
        
        # Get all active stocks
        cursor = await db.execute("SELECT symbol FROM stocks WHERE active = 1")
        rows = await cursor.fetchall()
        stocks = [row["symbol"] for row in rows]
        
        if not stocks:
            logger.info("No active stocks to sync")
            return
        
        logger.info(f"Syncing historical prices for {len(stocks)} stocks")
        
        processed = 0
        errors = 0
        
        for symbol in stocks:
            try:
                # Check existing data range
                cursor = await db.execute("""
                    SELECT MIN(date) as min_date, MAX(date) as max_date
                    FROM stock_price_history
                    WHERE symbol = ?
                """, (symbol,))
                row = await cursor.fetchone()
                
                # Determine date range to fetch
                if row and row["min_date"] and row["max_date"]:
                    # We have some data - check if we need to fill gaps
                    min_date = datetime.strptime(row["min_date"], "%Y-%m-%d")
                    max_date = datetime.strptime(row["max_date"], "%Y-%m-%d")
                    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                    
                    # Fetch from 2010-01-01 to min_date (if gap exists)
                    # and from max_date to today (if gap exists)
                    start_date = datetime(2010, 1, 1)
                    end_date = today
                    
                    # If we have recent data, only fetch missing recent days
                    if max_date >= today - timedelta(days=1):
                        # We have recent data, check if we need to backfill from start
                        if min_date > start_date:
                            # Backfill from start to min_date
                            await _fetch_and_store_prices(db, client, symbol, start_date, min_date - timedelta(days=1))
                    else:
                        # We're missing recent data, fetch from max_date to today
                        await _fetch_and_store_prices(db, client, symbol, max_date + timedelta(days=1), end_date)
                        # Also backfill from start if needed
                        if min_date > start_date:
                            await _fetch_and_store_prices(db, client, symbol, start_date, min_date - timedelta(days=1))
                else:
                    # No existing data - fetch everything from 2010-01-01 to now
                    start_date = datetime(2010, 1, 1)
                    end_date = datetime.now()
                    await _fetch_and_store_prices(db, client, symbol, start_date, end_date)
                
                processed += 1
                if processed % 10 == 0:
                    logger.info(f"Processed {processed}/{len(stocks)} stocks")
                
                # Rate limiting: 3 requests per second
                await asyncio.sleep(RATE_LIMIT_DELAY)
                
            except Exception as e:
                errors += 1
                logger.error(f"Failed to sync historical prices for {symbol}: {e}")
                continue
        
        logger.info(f"Stock price history sync complete: {processed} processed, {errors} errors")


async def _fetch_and_store_prices(
    db: aiosqlite.Connection,
    client,
    symbol: str,
    start: datetime,
    end: datetime
):
    """Fetch historical prices for a symbol and store in database."""
    try:
        ohlc_data = client.get_historical_prices(symbol, start=start, end=end)
        
        if not ohlc_data:
            logger.warning(f"No price data returned for {symbol} from {start.date()} to {end.date()}")
            return
        
        logger.info(f"Fetched {len(ohlc_data)} price records for {symbol} from {start.date()} to {end.date()}")
        
        now = datetime.now().isoformat()
        stored_count = 0
        for ohlc in ohlc_data:
            date = ohlc.timestamp.strftime("%Y-%m-%d")
            await db.execute("""
                INSERT OR REPLACE INTO stock_price_history 
                (symbol, date, close_price, open_price, high_price, low_price, volume, source, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                symbol,
                date,
                ohlc.close,
                ohlc.open,
                ohlc.high,
                ohlc.low,
                ohlc.volume,
                "tradernet",
                now,
            ))
        
        await db.commit()
        logger.debug(f"Stored {len(ohlc_data)} price records for {symbol}")
        
    except Exception as e:
        logger.error(f"Failed to fetch/store prices for {symbol} ({start} to {end}): {e}")
        raise


async def _reconstruct_portfolio_history():
    """Part B: Reconstruct historical portfolio values from trades + historical prices."""
    logger.info("Starting portfolio history reconstruction")
    
    async with aiosqlite.connect(settings.database_path) as db:
        db.row_factory = aiosqlite.Row
        
        # Get all trades ordered by date
        cursor = await db.execute("""
            SELECT symbol, side, quantity, price, executed_at
            FROM trades
            ORDER BY executed_at ASC
        """)
        trades = await cursor.fetchall()
        
        if not trades:
            logger.info("No trades found, skipping portfolio reconstruction")
            return
        
        # Get first and last trade dates (handle date parsing errors)
        try:
            first_trade_str = str(trades[0]["executed_at"])
            # Handle both ISO format and date-only format
            if 'T' in first_trade_str or len(first_trade_str) > 10:
                first_trade_date = datetime.fromisoformat(first_trade_str).date()
            else:
                first_trade_date = datetime.strptime(first_trade_str[:10], "%Y-%m-%d").date()
            
            last_trade_str = str(trades[-1]["executed_at"])
            if 'T' in last_trade_str or len(last_trade_str) > 10:
                last_trade_date = datetime.fromisoformat(last_trade_str).date()
            else:
                last_trade_date = datetime.strptime(last_trade_str[:10], "%Y-%m-%d").date()
        except (ValueError, TypeError) as e:
            logger.error(f"Failed to parse trade dates: {e}")
            return
        
        today = datetime.now().date()
        
        # Determine date range (from first trade or 2010-01-01 to today)
        start_date = min(first_trade_date, datetime(2010, 1, 1).date())
        end_date = max(last_trade_date, today)
        
        # Check existing snapshots
        cursor = await db.execute("""
            SELECT date FROM portfolio_snapshots
            ORDER BY date ASC
        """)
        existing_snapshots = {row["date"] for row in await cursor.fetchall()}
        
        # Get cash flows for cash balance reconstruction
        cash_flows = await _get_cash_flows(db)
        
        # Get initial cash balance (from first snapshot or estimate)
        initial_cash = await _get_initial_cash_balance(db)
        
        # Cache geography mapping for all stocks (to avoid repeated queries)
        cursor = await db.execute("SELECT symbol, geography FROM stocks")
        geography_cache = {row["symbol"]: row["geography"] for row in await cursor.fetchall()}
        
        logger.info(f"Reconstructing portfolio history from {start_date} to {end_date}")
        
        # Process each date
        current_date = start_date
        positions: Dict[str, float] = {}  # symbol -> quantity
        cash_balance = initial_cash
        processed = 0
        trade_index = 0  # Track which trades we've already applied
        
        while current_date <= end_date:
            date_str = current_date.strftime("%Y-%m-%d")
            
            # Skip if snapshot already exists
            if date_str in existing_snapshots:
                current_date += timedelta(days=1)
                continue
            
            # Apply trades up to this date (only apply each trade once)
            while trade_index < len(trades):
                trade = trades[trade_index]
                try:
                    trade_str = str(trade["executed_at"])
                    # Handle both ISO format and date-only format
                    if 'T' in trade_str or len(trade_str) > 10:
                        trade_date = datetime.fromisoformat(trade_str).date()
                    else:
                        trade_date = datetime.strptime(trade_str[:10], "%Y-%m-%d").date()
                except (ValueError, TypeError) as e:
                    logger.warning(f"Failed to parse trade date for trade {trade_index}: {e}, skipping")
                    trade_index += 1
                    continue
                
                if trade_date > current_date:
                    break
                
                symbol = trade["symbol"]
                side = trade["side"].upper()
                quantity = trade["quantity"]
                price = trade["price"]
                
                if side == "BUY":
                    positions[symbol] = positions.get(symbol, 0) + quantity
                    cash_balance -= quantity * price  # Decrease cash
                elif side == "SELL":
                    positions[symbol] = positions.get(symbol, 0) - quantity
                    cash_balance += quantity * price  # Increase cash
                
                trade_index += 1
            
            # Apply cash flows on their specific date (only once)
            if current_date in cash_flows:
                cash_balance += cash_flows[current_date]
            
            # Calculate portfolio value from positions + historical prices
            total_value = cash_balance
            geo_values = {"EU": 0.0, "ASIA": 0.0, "US": 0.0}
            
            for symbol, quantity in positions.items():
                if quantity <= 0:
                    continue
                
                # Get historical price for this date
                # If no price for this exact date (weekend/holiday), try previous trading day
                price = await _get_historical_price(db, symbol, date_str)
                if price is None:
                    # Try to find the most recent price before this date
                    price = await _get_most_recent_price(db, symbol, date_str)
                    if price is None:
                        # No price data available, skip this position
                        logger.debug(f"No price data for {symbol} on {date_str}, skipping")
                        continue
                
                position_value = quantity * price
                total_value += position_value
                
                # Get geography from cache
                geo = geography_cache.get(symbol)
                if geo and geo in geo_values:
                    geo_values[geo] += position_value
            
            # Store snapshot
            await db.execute("""
                INSERT OR REPLACE INTO portfolio_snapshots
                (date, total_value, cash_balance, geo_eu_pct, geo_asia_pct, geo_us_pct)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                date_str,
                total_value,
                cash_balance,
                geo_values["EU"] / total_value if total_value > 0 else 0,
                geo_values["ASIA"] / total_value if total_value > 0 else 0,
                geo_values["US"] / total_value if total_value > 0 else 0,
            ))
            
            processed += 1
            if processed % 100 == 0:
                logger.info(f"Processed {processed} portfolio snapshots")
            
            current_date += timedelta(days=1)
        
        await db.commit()
        logger.info(f"Portfolio history reconstruction complete: {processed} snapshots created")


async def _get_cash_flows(db: aiosqlite.Connection) -> Dict[datetime.date, float]:
    """Get cash flows from cash_flows table, grouped by date."""
    cursor = await db.execute("""
        SELECT date, amount_eur
        FROM cash_flows
        WHERE status = 'completed' OR status_c = 3
        ORDER BY date ASC
    """)
    rows = await cursor.fetchall()
    
    cash_flows = {}
    for row in rows:
        date = datetime.strptime(row["date"], "%Y-%m-%d").date()
        amount = row["amount_eur"]
        # Sum multiple cash flows on the same date
        cash_flows[date] = cash_flows.get(date, 0) + amount
    
    return cash_flows


async def _get_initial_cash_balance(db: aiosqlite.Connection) -> float:
    """Get initial cash balance from first portfolio snapshot or estimate."""
    cursor = await db.execute("""
        SELECT cash_balance FROM portfolio_snapshots
        ORDER BY date ASC
        LIMIT 1
    """)
    row = await cursor.fetchone()
    
    if row:
        return float(row["cash_balance"])
    
    # No snapshot exists, estimate from trades
    # Get first trade and estimate initial cash
    cursor = await db.execute("""
        SELECT SUM(CASE WHEN side = 'BUY' THEN quantity * price ELSE 0 END) as total_buys
        FROM trades
    """)
    row = await cursor.fetchone()
    
    if row and row["total_buys"]:
        # Estimate initial cash as 2x total buys (arbitrary estimate)
        return float(row["total_buys"]) * 2.0
    
    # Default fallback
    return 0.0


async def _get_historical_price(db: aiosqlite.Connection, symbol: str, date: str) -> Optional[float]:
    """Get historical close price for a symbol on a specific date."""
    cursor = await db.execute("""
        SELECT close_price FROM stock_price_history
        WHERE symbol = ? AND date = ?
    """, (symbol, date))
    row = await cursor.fetchone()
    
    if row:
        return float(row["close_price"])
    
    return None


async def _get_most_recent_price(db: aiosqlite.Connection, symbol: str, date: str) -> Optional[float]:
    """Get the most recent historical price for a symbol before the given date."""
    cursor = await db.execute("""
        SELECT close_price FROM stock_price_history
        WHERE symbol = ? AND date < ?
        ORDER BY date DESC
        LIMIT 1
    """, (symbol, date))
    row = await cursor.fetchone()
    
    if row:
        return float(row["close_price"])
    
    return None
