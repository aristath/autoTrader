"""Pydantic models for Planning service REST API."""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


# Request Models


class PositionInput(BaseModel):
    """Position input for planning."""

    symbol: str
    isin: Optional[str] = None
    quantity: int
    average_price: float
    current_price: float
    market_value: float


class CreatePlanRequest(BaseModel):
    """Request to create a new plan."""

    portfolio_hash: str
    available_cash: float
    positions: List[PositionInput]
    constraints: Dict[str, str] = Field(default_factory=dict, description="Planning constraints and target weights")


# Response Models


class PlannedAction(BaseModel):
    """Single planned action."""

    side: str  # BUY or SELL
    symbol: str
    isin: Optional[str] = None
    quantity: int
    estimated_price: float
    estimated_cost: float
    reason: str
    priority: int


class Plan(BaseModel):
    """Complete plan."""

    id: str
    portfolio_hash: str
    actions: List[PlannedAction]
    score: float
    expected_cost: float
    expected_value: float
    created_at: str
    status: str  # DRAFT, READY, EXECUTING, COMPLETED, FAILED


class PlanUpdate(BaseModel):
    """Plan creation progress update."""

    plan_id: str
    progress_pct: float
    current_step: str
    complete: bool
    error: Optional[str] = None
    plan: Optional[Plan] = None


class CreatePlanResponse(BaseModel):
    """Response from plan creation."""

    plan_id: str
    success: bool
    message: str
    plan: Optional[Plan] = None


class GetPlanResponse(BaseModel):
    """Response for get plan request."""

    found: bool
    plan: Optional[Plan] = None


class ListPlansResponse(BaseModel):
    """Response for list plans request."""

    plans: List[Plan]
    total: int


class GetBestResultResponse(BaseModel):
    """Response for get best result request."""

    found: bool
    plan: Optional[Plan] = None


class HealthResponse(BaseModel):
    """Health check response."""

    healthy: bool
    version: str
    status: str
    checks: dict = {}
