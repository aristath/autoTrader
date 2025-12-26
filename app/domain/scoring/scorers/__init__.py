"""Scorer functions for converting raw metrics to scores (0-1 range).

Scorer functions convert calculated metrics (CAGR, Sharpe, RSI, etc.) into
normalized scores (0.0 to 1.0) for use in composite scoring.
"""

from app.domain.scoring.scorers.long_term import (
    score_cagr,
    score_sharpe,
    score_sortino,
)
from app.domain.scoring.scorers.technicals import (
    score_rsi,
    score_bollinger,
    score_ema_distance,
)
from app.domain.scoring.scorers.opportunity import (
    score_below_52w_high,
    score_pe_ratio,
)
from app.domain.scoring.scorers.dividends import (
    score_dividend_yield,
    score_dividend_consistency,
)
from app.domain.scoring.scorers.short_term import (
    score_momentum,
    score_drawdown,
)
from app.domain.scoring.scorers.end_state import (
    score_total_return,
)

__all__ = [
    # Long-term scorers
    "score_cagr",
    "score_sharpe",
    "score_sortino",
    # Technical scorers
    "score_rsi",
    "score_bollinger",
    "score_ema_distance",
    # Opportunity scorers
    "score_below_52w_high",
    "score_pe_ratio",
    # Dividend scorers
    "score_dividend_yield",
    "score_dividend_consistency",
    # Short-term scorers
    "score_momentum",
    "score_drawdown",
    # End-state scorers
    "score_total_return",
]

