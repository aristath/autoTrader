"""Dependency injection for Gateway service."""

from functools import lru_cache

from app.modules.gateway.services.local_gateway_service import LocalGatewayService


@lru_cache()
def get_gateway_service() -> LocalGatewayService:
    """
    Get Gateway service instance.

    Returns:
        LocalGatewayService instance (cached singleton)
    """
    return LocalGatewayService()
