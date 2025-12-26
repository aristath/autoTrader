"""Calculation functions for scoring.

This module contains pure calculation functions that are shared across
different scoring groups. Each function performs a specific calculation
without side effects or caching.
"""

from app.domain.scoring.calculations.cagr import calculate_cagr

__all__ = ["calculate_cagr"]
