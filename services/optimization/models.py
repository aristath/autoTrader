"""Pydantic models for Optimization service REST API."""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


# Request Models


class PositionInput(BaseModel):
    """Position input for optimization."""

    isin: str
    symbol: str
    market_value: float


class AllocationTargetInput(BaseModel):
    """Target allocation for a security."""

    isin: str
    symbol: str
    target_weight: float


class OptimizeAllocationRequest(BaseModel):
    """Request to optimize portfolio allocation."""

    current_positions: List[PositionInput]
    target_allocations: List[AllocationTargetInput]
    available_cash: float


class TradeInput(BaseModel):
    """Trade input for execution optimization."""

    isin: str
    symbol: str
    quantity: int
    side: str = Field(..., description="BUY or SELL")


class OptimizeExecutionRequest(BaseModel):
    """Request to optimize trade execution."""

    trades: List[TradeInput]


class CalculateRebalancingRequest(BaseModel):
    """Request to calculate optimal rebalancing."""

    target_allocations: List[AllocationTargetInput]
    available_cash: float


# Response Models


class AllocationChange(BaseModel):
    """Recommended allocation change."""

    isin: str
    symbol: str
    quantity_change: float


class OptimizeAllocationResponse(BaseModel):
    """Response from allocation optimization."""

    success: bool
    changes: List[AllocationChange]
    objective_value: float = 0.0
    solver_status: str


class ExecutionPlan(BaseModel):
    """Trade execution plan."""

    trade_id: str
    isin: str
    symbol: str
    total_quantity: int
    slice_count: int = 1
    estimated_slippage: float = 0.0


class OptimizeExecutionResponse(BaseModel):
    """Response from execution optimization."""

    success: bool
    execution_plans: List[ExecutionPlan]


class CalculateRebalancingResponse(BaseModel):
    """Response from rebalancing calculation."""

    needs_rebalancing: bool
    changes: List[AllocationChange]
    total_drift_pct: float = 0.0


class HealthResponse(BaseModel):
    """Health check response."""

    healthy: bool
    version: str
    status: str
    checks: dict = {}
