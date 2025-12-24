"""
Quality Score - Long-term value assessment.

Components:
- Total Return (40%): CAGR + Dividend Yield, bell curve with 11% peak
- Consistency (20%): 5-year vs 10-year CAGR similarity
- Financial Strength (20%): Profit margin, debt/equity, current ratio
- Sharpe Ratio (10%): Risk-adjusted return quality (empyrical)
- Max Drawdown (10%): Resilience to losses (empyrical)
- Dividend Bonus: +0.10 max for high-yield stocks (DRIP priority)
"""

import math
import logging
from typing import Optional, List, Dict

import numpy as np

from app.domain.scoring.models import QualityScore
from app.domain.scoring.constants import (
    OPTIMAL_CAGR,
    BELL_CURVE_SIGMA_LEFT,
    BELL_CURVE_SIGMA_RIGHT,
    BELL_CURVE_FLOOR,
    HIGH_DIVIDEND_THRESHOLD,
    MID_DIVIDEND_THRESHOLD,
    LOW_DIVIDEND_BONUS,
    MID_DIVIDEND_BONUS,
    HIGH_DIVIDEND_BONUS,
    QUALITY_WEIGHT_TOTAL_RETURN,
    QUALITY_WEIGHT_CONSISTENCY,
    QUALITY_WEIGHT_FINANCIAL_STRENGTH,
    QUALITY_WEIGHT_SHARPE,
    QUALITY_WEIGHT_MAX_DRAWDOWN,
    SHARPE_EXCELLENT,
    SHARPE_GOOD,
    SHARPE_OK,
    DRAWDOWN_EXCELLENT,
    DRAWDOWN_GOOD,
    DRAWDOWN_OK,
    DRAWDOWN_POOR,
    MIN_MONTHS_FOR_CAGR,
)
from app.domain.scoring.technical import (
    calculate_sharpe_ratio,
    calculate_max_drawdown,
)

logger = logging.getLogger(__name__)


def score_total_return(
    total_return: float,
    target_annual_return: float = OPTIMAL_CAGR
) -> float:
    """
    Bell curve scoring for total return (CAGR + dividend yield).

    Peak at target_annual_return (default 11% for ~€1M retirement goal).
    Uses asymmetric Gaussian: steeper rise, gentler fall for high growth.

    Args:
        total_return: Combined CAGR + dividend yield as decimal (e.g., 0.11 for 11%)
        target_annual_return: Target annual return (default 0.11 = 11%)

    Returns:
        Score from 0.15 (floor) to 1.0 (peak at target)
    """
    peak = target_annual_return

    if total_return <= 0:
        return BELL_CURVE_FLOOR

    sigma = BELL_CURVE_SIGMA_LEFT if total_return < peak else BELL_CURVE_SIGMA_RIGHT

    # Gaussian formula
    raw_score = math.exp(-((total_return - peak) ** 2) / (2 * sigma ** 2))

    return BELL_CURVE_FLOOR + raw_score * (1 - BELL_CURVE_FLOOR)


def calculate_dividend_bonus(dividend_yield: Optional[float]) -> float:
    """
    Calculate bonus for high-dividend stocks (DRIP priority).

    Args:
        dividend_yield: Current dividend yield as decimal (e.g., 0.09 for 9%)

    Returns:
        Bonus from 0 to 0.10
    """
    if not dividend_yield or dividend_yield <= 0:
        return 0.0

    if dividend_yield >= HIGH_DIVIDEND_THRESHOLD:  # 6%+ yield
        return HIGH_DIVIDEND_BONUS
    elif dividend_yield >= MID_DIVIDEND_THRESHOLD:  # 3-6% yield
        return MID_DIVIDEND_BONUS
    else:  # Any dividend
        return LOW_DIVIDEND_BONUS


def calculate_cagr(prices: List[Dict], months: int) -> Optional[float]:
    """
    Calculate CAGR from monthly prices.

    Args:
        prices: List of dicts with year_month and avg_adj_close
        months: Number of months to use (e.g., 60 for 5 years)

    Returns:
        CAGR as decimal or None if insufficient data
    """
    if len(prices) < MIN_MONTHS_FOR_CAGR:
        return None

    # Use last N months or all available
    use_months = min(months, len(prices))
    price_slice = prices[-use_months:]

    start_price = price_slice[0].get("avg_adj_close")
    end_price = price_slice[-1].get("avg_adj_close")

    if not start_price or not end_price or start_price <= 0:
        return None

    years = use_months / 12.0
    if years < 0.25:  # Less than 3 months
        return (end_price / start_price) - 1  # Simple return

    try:
        return (end_price / start_price) ** (1 / years) - 1
    except (ValueError, ZeroDivisionError):
        return None


def calculate_consistency_score(cagr_5y: float, cagr_10y: Optional[float]) -> float:
    """
    Calculate consistency score based on 5y vs 10y CAGR similarity.

    Consistent growers (similar CAGR over different periods) score higher.

    Args:
        cagr_5y: 5-year CAGR
        cagr_10y: 10-year CAGR (None if not enough data)

    Returns:
        Score from 0.4 to 1.0
    """
    if cagr_10y is None:
        return 0.6  # Neutral for newer stocks

    diff = abs(cagr_5y - cagr_10y)

    if diff < 0.02:  # Within 2%
        return 1.0
    elif diff < 0.05:  # Within 5%
        return 0.8
    else:
        return max(0.4, 1.0 - diff * 4)


def calculate_financial_strength_score(fundamentals) -> float:
    """
    Calculate financial strength from fundamental data.

    Components:
    - Profit Margin (40%): Higher = better
    - Debt/Equity (30%): Lower = better
    - Current Ratio (30%): Higher = better (up to 3)

    Args:
        fundamentals: Yahoo fundamentals data

    Returns:
        Score from 0 to 1.0
    """
    if not fundamentals:
        return 0.5  # Neutral

    # Profit margin (40%): Higher = better
    margin = fundamentals.profit_margin or 0
    if margin >= 0:
        margin_score = min(1.0, 0.5 + margin * 2.5)
    else:
        margin_score = max(0, 0.5 + margin * 2)

    # Debt/Equity (30%): Lower = better (cap at 200)
    de = min(200, fundamentals.debt_to_equity or 50)
    de_score = max(0, 1 - de / 200)

    # Current ratio (30%): Higher = better (cap at 3)
    cr = min(3, fundamentals.current_ratio or 1)
    cr_score = min(1.0, cr / 2)

    return (
        margin_score * 0.40 +
        de_score * 0.30 +
        cr_score * 0.30
    )


def calculate_sharpe_score(sharpe_ratio: Optional[float]) -> float:
    """
    Convert Sharpe ratio to score.

    Sharpe > 2.0 is excellent, > 1.0 is good.

    Args:
        sharpe_ratio: Sharpe ratio value

    Returns:
        Score from 0 to 1.0
    """
    if sharpe_ratio is None:
        return 0.5  # Neutral if no data

    if sharpe_ratio >= SHARPE_EXCELLENT:  # >= 2.0
        return 1.0
    elif sharpe_ratio >= SHARPE_GOOD:  # >= 1.0
        return 0.7 + (sharpe_ratio - SHARPE_GOOD) * 0.3  # 0.7-1.0
    elif sharpe_ratio >= SHARPE_OK:  # >= 0.5
        return 0.4 + (sharpe_ratio - SHARPE_OK) * 0.6  # 0.4-0.7
    elif sharpe_ratio >= 0:
        return sharpe_ratio * 0.8  # 0.0-0.4
    else:
        return 0.0  # Negative Sharpe = poor


def calculate_drawdown_score(max_drawdown: Optional[float]) -> float:
    """
    Convert max drawdown to score.

    < 10% drawdown is excellent, > 50% is very bad.

    Args:
        max_drawdown: Max drawdown as negative decimal (e.g., -0.20)

    Returns:
        Score from 0 to 1.0
    """
    if max_drawdown is None:
        return 0.5  # Neutral if no data

    dd_pct = abs(max_drawdown)  # Convert to positive

    if dd_pct <= DRAWDOWN_EXCELLENT:  # <= 10%
        return 1.0
    elif dd_pct <= DRAWDOWN_GOOD:  # <= 20%
        return 0.8 + (DRAWDOWN_GOOD - dd_pct) * 2  # 0.8-1.0
    elif dd_pct <= DRAWDOWN_OK:  # <= 30%
        return 0.6 + (DRAWDOWN_OK - dd_pct) * 2  # 0.6-0.8
    elif dd_pct <= DRAWDOWN_POOR:  # <= 50%
        return 0.2 + (DRAWDOWN_POOR - dd_pct) * 2  # 0.2-0.6
    else:
        return max(0.0, 0.2 - (dd_pct - DRAWDOWN_POOR))  # 0.0-0.2


def calculate_quality_score(
    monthly_prices: List[Dict],
    daily_prices: List[Dict],
    fundamentals,
    target_annual_return: float = OPTIMAL_CAGR
) -> Optional[QualityScore]:
    """
    Calculate complete quality score.

    Args:
        monthly_prices: List of monthly price dicts for CAGR
        daily_prices: List of daily price dicts for risk metrics
        fundamentals: Yahoo fundamentals data
        target_annual_return: Target return for bell curve

    Returns:
        QualityScore or None if insufficient data
    """
    # Validate minimum data
    if len(monthly_prices) < MIN_MONTHS_FOR_CAGR:
        logger.warning(f"Insufficient monthly data: {len(monthly_prices)} months")
        return None

    # Calculate history in years
    history_years = len(monthly_prices) / 12.0

    # Calculate CAGRs
    cagr_5y = calculate_cagr(monthly_prices, 60)  # 5 years
    if cagr_5y is None:
        cagr_5y = calculate_cagr(monthly_prices, len(monthly_prices))

    cagr_10y = None
    if len(monthly_prices) > 60:
        cagr_10y = calculate_cagr(monthly_prices, len(monthly_prices))

    # Get dividend yield
    dividend_yield = fundamentals.dividend_yield if fundamentals else None

    # Total Return = CAGR + Dividend
    total_return = (cagr_5y or 0) + (dividend_yield or 0)

    # Calculate risk metrics from daily prices
    sharpe_ratio = None
    max_drawdown = None
    if len(daily_prices) >= 50:
        closes = np.array([p["close"] for p in daily_prices])
        sharpe_ratio = calculate_sharpe_ratio(closes)
        max_drawdown = calculate_max_drawdown(closes)

    # Component scores
    total_return_score = score_total_return(total_return, target_annual_return)
    consistency_score = calculate_consistency_score(cagr_5y or 0, cagr_10y)
    financial_strength_score = calculate_financial_strength_score(fundamentals)
    dividend_bonus = calculate_dividend_bonus(dividend_yield)
    sharpe_ratio_score = calculate_sharpe_score(sharpe_ratio)
    max_drawdown_score = calculate_drawdown_score(max_drawdown)

    # Combined score (capped at 1.0)
    total = min(1.0, (
        total_return_score * QUALITY_WEIGHT_TOTAL_RETURN +
        consistency_score * QUALITY_WEIGHT_CONSISTENCY +
        financial_strength_score * QUALITY_WEIGHT_FINANCIAL_STRENGTH +
        sharpe_ratio_score * QUALITY_WEIGHT_SHARPE +
        max_drawdown_score * QUALITY_WEIGHT_MAX_DRAWDOWN +
        dividend_bonus
    ))

    return QualityScore(
        total_return_score=round(total_return_score, 3),
        consistency_score=round(consistency_score, 3),
        financial_strength_score=round(financial_strength_score, 3),
        dividend_bonus=round(dividend_bonus, 3),
        sharpe_ratio_score=round(sharpe_ratio_score, 3),
        max_drawdown_score=round(max_drawdown_score, 3),
        total=round(total, 3),
        cagr_5y=round(cagr_5y, 4) if cagr_5y else None,
        cagr_10y=round(cagr_10y, 4) if cagr_10y else None,
        total_return=round(total_return, 4) if total_return else None,
        dividend_yield=round(dividend_yield, 4) if dividend_yield else None,
        sharpe_ratio=round(sharpe_ratio, 4) if sharpe_ratio else None,
        max_drawdown=round(max_drawdown, 4) if max_drawdown else None,
        history_years=round(history_years, 1),
    )
