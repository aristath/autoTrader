"""Pydantic models for Gateway service REST API."""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


# Request Models


class TriggerTradingCycleRequest(BaseModel):
    """Request to trigger a trading cycle."""

    force: bool = Field(default=False, description="Force cycle even if conditions not met")
    deposit_amount: Optional[float] = Field(default=None, description="Optional deposit amount")


class ProcessDepositRequest(BaseModel):
    """Request to process a deposit."""

    account_id: str = Field(default="default", description="Account identifier")
    amount: float = Field(..., gt=0, description="Deposit amount")


# Response Models


class ServiceStatus(BaseModel):
    """Status of a single service."""

    service_name: str
    healthy: bool
    version: str = ""
    status_message: str = ""


class SystemStatusResponse(BaseModel):
    """Overall system status response."""

    system_healthy: bool
    services: List[ServiceStatus]
    overall_message: str


class TradingCycleUpdate(BaseModel):
    """Trading cycle progress update."""

    cycle_id: str
    phase: str
    progress_pct: float
    message: str
    complete: bool
    success: bool = False
    error: Optional[str] = None
    results: Dict[str, str] = Field(default_factory=dict)


class TradingCycleResponse(BaseModel):
    """Response from triggering trading cycle."""

    cycle_id: str
    success: bool
    message: str
    final_update: Optional[TradingCycleUpdate] = None


class ProcessDepositResponse(BaseModel):
    """Response from processing deposit."""

    success: bool
    new_balance: float
    message: str


class ServiceHealthResponse(BaseModel):
    """Response for specific service health."""

    found: bool
    status: Optional[ServiceStatus] = None


class HealthResponse(BaseModel):
    """Health check response."""

    healthy: bool
    version: str
    status: str
    checks: dict = {}
