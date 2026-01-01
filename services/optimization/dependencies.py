"""Dependency injection for Optimization service."""

from functools import lru_cache

from app.modules.optimization.services.local_optimization_service import (
    LocalOptimizationService,
)


@lru_cache()
def get_optimization_service() -> LocalOptimizationService:
    """
    Get Optimization service instance.

    Returns:
        LocalOptimizationService instance (cached singleton)
    """
    return LocalOptimizationService()
