"""Cash flow sync job for periodic updates from Tradernet API."""

import logging

from app.services.tradernet import get_tradernet_client
from app.infrastructure.locking import file_lock
from app.infrastructure.events import emit, SystemEvent
from app.infrastructure.hardware.led_display import set_activity
from app.infrastructure.database.manager import get_db_manager

logger = logging.getLogger(__name__)


async def sync_cash_flows():
    """
    Sync cash flow transactions from Tradernet API to local database.

    This job:
    1. Fetches all cash flow transactions from Tradernet API
    2. Upserts them into the local database
    3. Handles errors gracefully with logging

    Uses file locking to prevent concurrent syncs.
    """
    async with file_lock("cash_flow_sync", timeout=120.0):
        await _sync_cash_flows_internal()


async def _sync_cash_flows_internal():
    """Internal cash flow sync implementation."""
    logger.info("Starting cash flow sync")

    emit(SystemEvent.CASH_FLOW_SYNC_START)
    set_activity("SYNCING CASH FLOWS...", duration=30.0)

    client = get_tradernet_client()

    if not client.is_connected:
        if not client.connect():
            logger.warning("Failed to connect to Tradernet, skipping cash flow sync")
            emit(SystemEvent.ERROR_OCCURRED, message="BROKER CONNECTION FAILED")
            return

    try:
        # Fetch all cash flows from API
        transactions = client.get_all_cash_flows(limit=1000)

        if not transactions:
            logger.info("No cash flow transactions found in API")
            return

        logger.info(f"Fetched {len(transactions)} transactions from API")

        db_manager = get_db_manager()

        # Get existing transaction IDs to avoid duplicates
        cursor = await db_manager.ledger.execute(
            "SELECT transaction_id FROM cash_flows WHERE transaction_id IS NOT NULL"
        )
        existing_ids = {row[0] for row in await cursor.fetchall()}

        synced_count = 0
        async with db_manager.ledger.transaction():
            for txn in transactions:
                txn_id = txn.get("transaction_id")
                if txn_id and txn_id in existing_ids:
                    continue

                await db_manager.ledger.execute(
                    """
                    INSERT INTO cash_flows
                    (transaction_id, date, type, amount, currency, description, symbol)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        txn.get("transaction_id"),
                        txn.get("date"),
                        txn.get("type"),
                        txn.get("amount"),
                        txn.get("currency", "EUR"),
                        txn.get("description"),
                        txn.get("symbol"),
                    )
                )
                synced_count += 1

        logger.info(
            f"Cash flow sync complete: {synced_count}/{len(transactions)} transactions synced"
        )

        emit(SystemEvent.CASH_FLOW_SYNC_COMPLETE)
        set_activity("CASH FLOW SYNC COMPLETE", duration=5.0)

    except Exception as e:
        logger.error(f"Cash flow sync failed: {e}", exc_info=True)
        emit(SystemEvent.ERROR_OCCURRED, message="CASH FLOW SYNC FAILED")
        return
