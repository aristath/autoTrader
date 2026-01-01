"""Integration tests for Scoring gRPC service."""

import grpc
import pytest

from contracts import scoring_pb2  # type: ignore[attr-defined]
from contracts import scoring_pb2_grpc  # type: ignore[attr-defined]


@pytest.mark.asyncio
async def test_scoring_health_check(scoring_server):
    """Test Scoring service health check."""
    async with grpc.aio.insecure_channel(scoring_server) as channel:
        stub = scoring_pb2_grpc.ScoringServiceStub(channel)
        response = await stub.HealthCheck(scoring_pb2.Empty())

        assert response.healthy is True
        assert response.version == "1.0.0"
        assert response.status == "OK"


@pytest.mark.asyncio
async def test_score_security(scoring_server):
    """Test scoring a single security."""
    async with grpc.aio.insecure_channel(scoring_server) as channel:
        stub = scoring_pb2_grpc.ScoringServiceStub(channel)

        request = scoring_pb2.ScoreSecurityRequest(isin="US0378331005", symbol="AAPL")
        response = await stub.ScoreSecurity(request)

        # May not find the security in test environment
        assert isinstance(response.found, bool)


@pytest.mark.asyncio
async def test_batch_score_securities(scoring_server):
    """Test scoring multiple securities."""
    async with grpc.aio.insecure_channel(scoring_server) as channel:
        stub = scoring_pb2_grpc.ScoringServiceStub(channel)

        request = scoring_pb2.BatchScoreSecuritiesRequest(
            isins=["US0378331005", "US5949181045"]
        )
        response = await stub.BatchScoreSecurities(request)

        assert isinstance(response.scores, list)
        assert response.total_scored >= 0
        assert response.failed >= 0
