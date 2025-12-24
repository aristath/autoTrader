"""
Stock Scorer - Orchestrator for all scoring calculations.

This module coordinates the calculation of all score components
and combines them into a final stock score.

Final weights for BUY decisions:
- Quality: 35% (total return, consistency, financial strength, dividend bonus)
- Opportunity: 35% (buy-the-dip signals)
- Analyst: 15% (recommendations, price targets)
- Allocation Fit: 15% (portfolio awareness)
"""

import logging
from datetime import datetime
from typing import Optional, List

import numpy as np

from app.domain.scoring.models import (
    QualityScore,
    OpportunityScore,
    AnalystScore,
    AllocationFitScore,
    PortfolioContext,
    CalculatedStockScore,
    PrefetchedStockData,
)
from app.domain.scoring.constants import (
    SCORE_WEIGHT_QUALITY,
    SCORE_WEIGHT_OPPORTUNITY,
    SCORE_WEIGHT_ANALYST,
    SCORE_WEIGHT_ALLOCATION_FIT,
    SCORE_WEIGHT_BASE,
    DEFAULT_TARGET_ANNUAL_RETURN,
    DEFAULT_MARKET_AVG_PE,
)
from app.domain.scoring.quality import calculate_quality_score
from app.domain.scoring.opportunity import calculate_opportunity_score
from app.domain.scoring.analyst import calculate_analyst_score
from app.domain.scoring.allocation import calculate_allocation_fit_score
from app.domain.scoring.technical import calculate_volatility

logger = logging.getLogger(__name__)


def calculate_stock_score(
    symbol: str,
    daily_prices: List[dict],
    monthly_prices: List[dict],
    fundamentals,
    geography: str = None,
    industry: str = None,
    portfolio_context: PortfolioContext = None,
    yahoo_symbol: str = None,
    target_annual_return: float = DEFAULT_TARGET_ANNUAL_RETURN,
    market_avg_pe: float = DEFAULT_MARKET_AVG_PE,
) -> Optional[CalculatedStockScore]:
    """
    Calculate complete stock score with all components.

    This is the main entry point for scoring a stock. It coordinates
    all the individual score calculations and combines them.

    Args:
        symbol: Tradernet symbol
        daily_prices: List of daily price dicts (for opportunity and volatility)
        monthly_prices: List of monthly price dicts (for quality/CAGR)
        fundamentals: Yahoo fundamentals data
        geography: Stock geography (EU, ASIA, US) - required for allocation fit
        industry: Stock industry - required for allocation fit
        portfolio_context: Portfolio weights and positions for allocation fit
        yahoo_symbol: Optional explicit Yahoo symbol override
        target_annual_return: Target annual return for quality scoring
        market_avg_pe: Market average P/E for opportunity scoring

    Returns:
        CalculatedStockScore with all components, or None if insufficient data
    """
    # Calculate quality score
    quality = calculate_quality_score(
        monthly_prices=monthly_prices,
        daily_prices=daily_prices,
        fundamentals=fundamentals,
        target_annual_return=target_annual_return,
    )

    # Calculate opportunity score
    opportunity = calculate_opportunity_score(
        daily_prices=daily_prices,
        fundamentals=fundamentals,
        market_avg_pe=market_avg_pe,
    )

    # Calculate analyst score (uses Yahoo API)
    analyst = calculate_analyst_score(symbol, yahoo_symbol=yahoo_symbol)

    # Handle missing scores with defaults
    quality_total = quality.total if quality else 0.5
    opportunity_total = opportunity.total if opportunity else 0.5
    analyst_total = analyst.total if analyst else 0.5

    # Calculate allocation fit if portfolio context provided
    allocation_fit = None
    if portfolio_context and geography:
        allocation_fit = calculate_allocation_fit_score(
            symbol=symbol,
            geography=geography,
            industry=industry,
            quality_score=quality_total,
            opportunity_score=opportunity_total,
            portfolio_context=portfolio_context,
        )
        allocation_fit_total = allocation_fit.total
    else:
        allocation_fit_total = None

    # Calculate weighted total score
    if allocation_fit_total is not None:
        # Full calculation with all 4 components
        total_score = (
            quality_total * SCORE_WEIGHT_QUALITY +
            opportunity_total * SCORE_WEIGHT_OPPORTUNITY +
            analyst_total * SCORE_WEIGHT_ANALYST +
            allocation_fit_total * SCORE_WEIGHT_ALLOCATION_FIT
        )
    else:
        # Without allocation fit, normalize base score
        # (35% + 35% + 15%) / 85% = normalize to full scale
        base_score = (
            quality_total * SCORE_WEIGHT_QUALITY +
            opportunity_total * SCORE_WEIGHT_OPPORTUNITY +
            analyst_total * SCORE_WEIGHT_ANALYST
        )
        total_score = base_score / SCORE_WEIGHT_BASE

    # Calculate volatility from daily prices
    volatility = None
    if len(daily_prices) >= 30:
        closes = np.array([p["close"] for p in daily_prices])
        volatility = calculate_volatility(closes)

    # Create default scores if missing
    if not quality:
        quality = QualityScore(
            total_return_score=0.5,
            consistency_score=0.5,
            financial_strength_score=0.5,
            dividend_bonus=0.0,
            sharpe_ratio_score=0.5,
            max_drawdown_score=0.5,
            total=0.5,
            cagr_5y=None,
            cagr_10y=None,
            total_return=None,
            dividend_yield=None,
            sharpe_ratio=None,
            max_drawdown=None,
            history_years=0
        )
    if not opportunity:
        opportunity = OpportunityScore(
            below_52w_high=0.5,
            ema_distance=0.5,
            pe_vs_historical=0.5,
            rsi_score=0.5,
            bollinger_score=0.5,
            total=0.5
        )
    if not analyst:
        analyst = AnalystScore(
            recommendation_score=0.5,
            target_score=0.5,
            total=0.5
        )

    return CalculatedStockScore(
        symbol=symbol,
        quality=quality,
        opportunity=opportunity,
        analyst=analyst,
        allocation_fit=allocation_fit,
        total_score=round(total_score, 3),
        volatility=round(volatility, 4) if volatility else None,
        calculated_at=datetime.now(),
    )


def calculate_stock_score_from_prefetched(
    symbol: str,
    prefetched: PrefetchedStockData,
    geography: str = None,
    industry: str = None,
    portfolio_context: PortfolioContext = None,
    yahoo_symbol: str = None,
    target_annual_return: float = DEFAULT_TARGET_ANNUAL_RETURN,
    market_avg_pe: float = DEFAULT_MARKET_AVG_PE,
) -> Optional[CalculatedStockScore]:
    """
    Calculate stock score using pre-fetched data.

    This is a convenience wrapper that extracts data from PrefetchedStockData.

    Args:
        symbol: Tradernet symbol
        prefetched: Pre-fetched data containing daily/monthly prices and fundamentals
        geography: Stock geography (EU, ASIA, US)
        industry: Stock industry
        portfolio_context: Portfolio context for allocation fit
        yahoo_symbol: Optional explicit Yahoo symbol override
        target_annual_return: Target annual return for quality scoring
        market_avg_pe: Market average P/E for opportunity scoring

    Returns:
        CalculatedStockScore with all components
    """
    return calculate_stock_score(
        symbol=symbol,
        daily_prices=prefetched.daily_prices,
        monthly_prices=prefetched.monthly_prices,
        fundamentals=prefetched.fundamentals,
        geography=geography,
        industry=industry,
        portfolio_context=portfolio_context,
        yahoo_symbol=yahoo_symbol,
        target_annual_return=target_annual_return,
        market_avg_pe=market_avg_pe,
    )


def create_default_quality_score() -> QualityScore:
    """Create a neutral quality score for stocks without sufficient data."""
    return QualityScore(
        total_return_score=0.5,
        consistency_score=0.5,
        financial_strength_score=0.5,
        dividend_bonus=0.0,
        sharpe_ratio_score=0.5,
        max_drawdown_score=0.5,
        total=0.5,
        cagr_5y=None,
        cagr_10y=None,
        total_return=None,
        dividend_yield=None,
        sharpe_ratio=None,
        max_drawdown=None,
        history_years=0
    )


def create_default_opportunity_score() -> OpportunityScore:
    """Create a neutral opportunity score for stocks without sufficient data."""
    return OpportunityScore(
        below_52w_high=0.5,
        ema_distance=0.5,
        pe_vs_historical=0.5,
        rsi_score=0.5,
        bollinger_score=0.5,
        total=0.5
    )


def create_default_analyst_score() -> AnalystScore:
    """Create a neutral analyst score for stocks without analyst data."""
    return AnalystScore(
        recommendation_score=0.5,
        target_score=0.5,
        total=0.5
    )
