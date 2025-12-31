"""Optimizer API - Provides portfolio optimization status and results.

DEPRECATED: This module is kept for backward compatibility during migration.
Import from app.modules.optimization.api.optimizer instead.
"""

# Backward compatibility re-export (temporary - will be removed in Phase 5)
from app.modules.optimization.api.optimizer import router, update_optimization_cache

__all__ = ["router", "update_optimization_cache"]
