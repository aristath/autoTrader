"""Dependency injection for Planning service."""

from functools import lru_cache

from app.modules.planning.services.local_planning_service import LocalPlanningService


@lru_cache()
def get_planning_service() -> LocalPlanningService:
    """
    Get Planning service instance.

    Returns:
        LocalPlanningService instance (cached singleton)
    """
    return LocalPlanningService()
