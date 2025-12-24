"""Portfolio allocation and rebalancing logic."""

import logging

from app.config import settings
from app.domain.constants import (
    MIN_CONVICTION_MULTIPLIER,
    MAX_CONVICTION_MULTIPLIER,
    MIN_PRIORITY_MULTIPLIER,
    MAX_PRIORITY_MULTIPLIER,
    MIN_VOLATILITY_MULTIPLIER,
    MAX_POSITION_SIZE_MULTIPLIER,
)
from app.domain.models import (
    AllocationStatus,
    PortfolioSummary,
    TradeRecommendation,
    StockPriority,
)

logger = logging.getLogger(__name__)


def parse_industries(industry_str: str) -> list[str]:
    """
    Parse comma-separated industry string into list.

    Args:
        industry_str: Comma-separated industries (e.g., "Industrial, Defense")

    Returns:
        List of industry names, or empty list if None/empty
    """
    if not industry_str:
        return []
    return [ind.strip() for ind in industry_str.split(",") if ind.strip()]


def calculate_position_size(
    candidate: StockPriority,
    base_size: float,
    min_size: float,
) -> float:
    """
    Calculate position size based on conviction and risk.

    Args:
        candidate: Stock priority data
        base_size: Base investment amount per trade
        min_size: Minimum trade size

    Returns:
        Adjusted position size (0.8x to 1.2x of base)
    """
    # Conviction multiplier based on stock score
    conviction_mult = MIN_CONVICTION_MULTIPLIER + (candidate.stock_score - 0.5) * 0.8
    conviction_mult = max(MIN_CONVICTION_MULTIPLIER, min(MAX_CONVICTION_MULTIPLIER, conviction_mult))

    # Priority multiplier based on combined priority
    priority_mult = MIN_PRIORITY_MULTIPLIER + (candidate.combined_priority / 3.0) * 0.2
    priority_mult = max(MIN_PRIORITY_MULTIPLIER, min(MAX_PRIORITY_MULTIPLIER, priority_mult))

    # Volatility penalty (if available)
    if candidate.volatility is not None:
        vol_mult = max(MIN_VOLATILITY_MULTIPLIER, 1.0 - (candidate.volatility - 0.15) * 0.5)
    else:
        vol_mult = 1.0

    size = base_size * conviction_mult * priority_mult * vol_mult
    return max(min_size, min(size, base_size * MAX_POSITION_SIZE_MULTIPLIER))


def get_max_trades(cash: float) -> int:
    """
    Calculate maximum trades based on available cash.
    
    Args:
        cash: Available cash in EUR
        
    Returns:
        Maximum number of trades (0 to max_trades_per_cycle)
    """
    if cash < settings.min_trade_size:
        return 0
    return min(
        settings.max_trades_per_cycle,
        int(cash / settings.min_trade_size)
    )


# Removed calculate_rebalance_trades() - use RebalancingService.calculate_rebalance_trades() instead
# Removed execute_trades() - use TradeExecutionService.execute_trades() instead
