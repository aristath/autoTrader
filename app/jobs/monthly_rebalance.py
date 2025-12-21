"""Monthly rebalance job."""

import logging
from datetime import datetime

import aiosqlite

from app.config import settings

logger = logging.getLogger(__name__)


async def execute_monthly_rebalance():
    """
    Execute monthly portfolio rebalance.

    This job:
    1. Calculates current allocation vs targets
    2. Scores all stocks in universe
    3. Determines optimal trades for the monthly deposit
    4. Executes trades via Tradernet

    Note: This is a placeholder - full implementation in Phase 4.
    """
    logger.info("Starting monthly rebalance")

    try:
        # Import here to avoid circular imports
        from app.services.tradernet import get_tradernet_client
        from app.services.allocator import calculate_rebalance_trades

        client = get_tradernet_client()

        if not client.is_connected:
            if not client.connect():
                logger.error("Failed to connect to Tradernet, skipping rebalance")
                return

        # Get current portfolio state
        async with aiosqlite.connect(settings.database_path) as db:
            # Get allocation targets
            cursor = await db.execute(
                "SELECT type, name, target_pct FROM allocation_targets"
            )
            targets = {
                f"{row[0]}:{row[1]}": row[2]
                for row in await cursor.fetchall()
            }

            # Get current positions with geography
            cursor = await db.execute(
                """
                SELECT p.symbol, p.quantity, p.current_price, s.geography, s.industry
                FROM positions p
                JOIN stocks s ON p.symbol = s.symbol
                """
            )
            positions = await cursor.fetchall()

            # Get stock scores
            cursor = await db.execute(
                """
                SELECT s.symbol, s.geography, s.industry, sc.total_score
                FROM stocks s
                LEFT JOIN scores sc ON s.symbol = sc.symbol
                WHERE s.active = 1
                ORDER BY sc.total_score DESC NULLS LAST
                """
            )
            scored_stocks = await cursor.fetchall()

        # Calculate rebalance trades
        # This will be implemented in Phase 4
        trades = []  # calculate_rebalance_trades(...)

        if not trades:
            logger.info("No rebalance trades needed")
            return

        # Execute trades
        for trade in trades:
            logger.info(f"Executing trade: {trade}")
            # result = client.place_order(...)

        logger.info(f"Monthly rebalance complete: {len(trades)} trades executed")

    except Exception as e:
        logger.error(f"Monthly rebalance failed: {e}")
        raise
