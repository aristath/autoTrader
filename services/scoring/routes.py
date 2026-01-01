"""REST API routes for Scoring service."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.modules.scoring.services.local_scoring_service import LocalScoringService
from services.scoring.dependencies import get_scoring_service
from services.scoring.models import (
    BatchScoreSecuritiesRequest,
    BatchScoreSecuritiesResponse,
    HealthResponse,
    ScoreHistoryEntry,
    ScoreHistoryResponse,
    ScorePortfolioRequest,
    ScorePortfolioResponse,
    ScoreSecurityRequest,
    ScoreSecurityResponse,
    SecurityScore,
)

router = APIRouter()


@router.post("/score", response_model=ScoreSecurityResponse)
async def score_security(
    request: ScoreSecurityRequest,
    service: LocalScoringService = Depends(get_scoring_service),
):
    """
    Score a single security.

    Args:
        request: Security to score
        service: Scoring service instance

    Returns:
        Security score details
    """
    score = await service.score_security(
        isin=request.isin,
        symbol=request.symbol,
    )

    if score:
        security_score = SecurityScore(
            isin=score.isin,
            symbol=score.symbol,
            total_score=score.total_score,
            component_scores=score.component_scores,
            percentile=score.percentile,
            grade=score.grade,
        )
        return ScoreSecurityResponse(found=True, score=security_score)
    else:
        return ScoreSecurityResponse(found=False)


@router.post("/score/batch", response_model=BatchScoreSecuritiesResponse)
async def batch_score_securities(
    request: BatchScoreSecuritiesRequest,
    service: LocalScoringService = Depends(get_scoring_service),
):
    """
    Score multiple securities in batch.

    Args:
        request: List of ISINs to score
        service: Scoring service instance

    Returns:
        Batch scoring results
    """
    scores = await service.batch_score_securities(isins=request.isins)

    security_scores = [
        SecurityScore(
            isin=score.isin,
            symbol=score.symbol,
            total_score=score.total_score,
            component_scores=score.component_scores,
            percentile=score.percentile,
            grade=score.grade,
        )
        for score in scores
    ]

    return BatchScoreSecuritiesResponse(
        scores=security_scores,
        total_scored=len(scores),
        failed=0,
    )


@router.post("/score/portfolio", response_model=ScorePortfolioResponse)
async def score_portfolio(
    request: ScorePortfolioRequest,
    service: LocalScoringService = Depends(get_scoring_service),
):
    """
    Score entire portfolio.

    Args:
        request: Portfolio positions
        service: Scoring service instance

    Returns:
        Portfolio score with individual security scores
    """
    # Extract ISINs from positions
    isins = [pos.isin for pos in request.positions if pos.isin]

    if not isins:
        raise HTTPException(status_code=400, detail="No valid ISINs provided in positions")

    # Score all securities
    scores = await service.batch_score_securities(isins=isins)

    # Convert to SecurityScore
    security_scores = [
        SecurityScore(
            isin=score.isin,
            symbol=score.symbol,
            total_score=score.total_score,
            component_scores=score.component_scores,
            percentile=score.percentile,
            grade=score.grade,
        )
        for score in scores
    ]

    # Calculate weighted portfolio score
    total_value = sum(pos.market_value for pos in request.positions)
    weighted_score = 0.0
    if total_value > 0:
        for pos, score in zip(request.positions, scores):
            weight = pos.market_value / total_value
            weighted_score += score.total_score * weight

    # Calculate simple average
    total_score = sum(s.total_score for s in scores) / len(scores) if scores else 0.0

    return ScorePortfolioResponse(
        total_score=total_score,
        weighted_score=weighted_score,
        security_scores=security_scores,
        portfolio_metrics={"security_count": float(len(scores))},
    )


@router.get("/history/{isin}", response_model=ScoreHistoryResponse)
async def get_score_history(
    isin: str,
    service: LocalScoringService = Depends(get_scoring_service),
):
    """
    Get historical scores for a security.

    Args:
        isin: Security ISIN
        service: Scoring service instance

    Returns:
        Historical score data

    Note:
        Currently returns only current score - historical data not yet implemented
    """
    # Get current score (in full implementation, would query historical data)
    current_score = await service.score_security(isin=isin, symbol="")

    scores = []
    if current_score:
        # Return current score as single history point
        # Full implementation would query score_history table
        score_entry = ScoreHistoryEntry(
            date=datetime.now().isoformat(),
            total_score=current_score.total_score,
            component_scores=current_score.component_scores,
        )
        scores.append(score_entry)

    return ScoreHistoryResponse(isin=isin, scores=scores)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.

    Returns:
        Service health status
    """
    return HealthResponse(
        healthy=True,
        version="1.0.0",
        status="OK",
        checks={},
    )
