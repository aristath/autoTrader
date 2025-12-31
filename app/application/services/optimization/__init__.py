"""Portfolio Optimization Service.

DEPRECATED: This module is kept for backward compatibility during migration.
Import from app.modules.optimization.services instead.
"""

# Backward compatibility re-exports (temporary - will be removed in Phase 5)
from app.modules.optimization.services import (
    ConstraintsManager,
    ExpectedReturnsCalculator,
    OptimizationResult,
    PortfolioOptimizer,
    RiskModelBuilder,
    SectorConstraint,
    WeightBounds,
    WeightChange,
)

__all__ = [
    "PortfolioOptimizer",
    "OptimizationResult",
    "WeightChange",
    "ExpectedReturnsCalculator",
    "RiskModelBuilder",
    "ConstraintsManager",
    "WeightBounds",
    "SectorConstraint",
]
