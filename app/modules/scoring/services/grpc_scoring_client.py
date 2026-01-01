"""gRPC client for Scoring service."""

from typing import List, Optional

import grpc

from app.infrastructure.service_discovery import get_service_locator
from app.modules.scoring.services.scoring_service_interface import SecurityScore
from contracts import scoring_pb2, scoring_pb2_grpc  # type: ignore[attr-defined]


class GrpcScoringClient:
    """
    gRPC client for Scoring service.

    Implements ScoringServiceInterface over gRPC.
    """

    def __init__(self, channel: grpc.aio.Channel | None = None):
        """
        Initialize gRPC scoring client.

        Args:
            channel: Optional gRPC channel. If None, will create from service locator.
        """
        if channel is None:
            locator = get_service_locator()
            channel = locator.create_channel("scoring")

        self.stub = scoring_pb2_grpc.ScoringServiceStub(channel)

    async def score_security(self, isin: str, symbol: str) -> Optional[SecurityScore]:
        """
        Score a single security.

        Args:
            isin: Security ISIN
            symbol: Security symbol

        Returns:
            Security score if found, None otherwise
        """
        grpc_request = scoring_pb2.ScoreSecurityRequest(
            isin=isin,
            symbol=symbol,
        )

        try:
            grpc_response = await self.stub.ScoreSecurity(grpc_request)
            if grpc_response.found:
                return SecurityScore(
                    isin=grpc_response.score.isin,
                    symbol=grpc_response.score.symbol,
                    total_score=grpc_response.score.total_score,
                    component_scores=dict(grpc_response.score.component_scores),
                    percentile=grpc_response.score.percentile,
                    grade=grpc_response.score.grade,
                )
            return None
        except grpc.RpcError:
            return None

    async def batch_score_securities(self, isins: List[str]) -> List[SecurityScore]:
        """
        Score multiple securities.

        Args:
            isins: List of ISINs to score

        Returns:
            List of security scores
        """
        grpc_request = scoring_pb2.BatchScoreSecuritiesRequest(isins=isins)

        try:
            grpc_response = await self.stub.BatchScoreSecurities(grpc_request)
            return [
                SecurityScore(
                    isin=score.isin,
                    symbol=score.symbol,
                    total_score=score.total_score,
                    component_scores=dict(score.component_scores),
                    percentile=score.percentile,
                    grade=score.grade,
                )
                for score in grpc_response.scores
            ]
        except grpc.RpcError:
            return []
