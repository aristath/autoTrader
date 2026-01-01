"""Dependency injection for Scoring service."""

from functools import lru_cache

from app.modules.scoring.services.local_scoring_service import LocalScoringService


@lru_cache()
def get_scoring_service() -> LocalScoringService:
    """
    Get Scoring service instance.

    Returns:
        LocalScoringService instance (cached singleton)
    """
    return LocalScoringService()
