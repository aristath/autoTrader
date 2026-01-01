"""Pydantic models for Scoring service REST API."""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


# Request Models


class ScoreSecurityRequest(BaseModel):
    """Request to score a single security."""

    isin: Optional[str] = None
    symbol: str


class BatchScoreSecuritiesRequest(BaseModel):
    """Request to score multiple securities."""

    isins: List[str] = Field(..., description="List of ISINs to score")


class PositionInput(BaseModel):
    """Position for portfolio scoring."""

    isin: str
    symbol: str
    market_value: float


class ScorePortfolioRequest(BaseModel):
    """Request to score entire portfolio."""

    positions: List[PositionInput]


#Response Models


class SecurityScore(BaseModel):
    """Security score details."""

    isin: str
    symbol: str
    total_score: float
    component_scores: Dict[str, float] = {}
    percentile: float = 0.0
    grade: str = ""


class ScoreSecurityResponse(BaseModel):
    """Response for single security score."""

    found: bool
    score: Optional[SecurityScore] = None


class BatchScoreSecuritiesResponse(BaseModel):
    """Response for batch scoring."""

    scores: List[SecurityScore]
    total_scored: int
    failed: int = 0


class ScorePortfolioResponse(BaseModel):
    """Response for portfolio scoring."""

    total_score: float
    weighted_score: float
    security_scores: List[SecurityScore]
    portfolio_metrics: Dict[str, float] = {}


class ScoreHistoryEntry(BaseModel):
    """Historical score entry."""

    date: str
    total_score: float
    component_scores: Dict[str, float] = {}


class ScoreHistoryResponse(BaseModel):
    """Response for score history."""

    isin: str
    scores: List[ScoreHistoryEntry]


class HealthResponse(BaseModel):
    """Health check response."""

    healthy: bool
    version: str
    status: str
    checks: dict = {}
