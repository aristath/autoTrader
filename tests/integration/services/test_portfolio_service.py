"""Integration tests for Portfolio gRPC service."""

import grpc
import pytest

from contracts import portfolio_pb2  # type: ignore[attr-defined]
from contracts import portfolio_pb2_grpc  # type: ignore[attr-defined]


@pytest.mark.asyncio
async def test_portfolio_health_check(portfolio_server):
    """Test Portfolio service health check."""
    async with grpc.aio.insecure_channel(portfolio_server) as channel:
        stub = portfolio_pb2_grpc.PortfolioServiceStub(channel)
        response = await stub.HealthCheck(portfolio_pb2.Empty())

        assert response.healthy is True
        assert response.version == "1.0.0"
        assert response.status == "OK"


@pytest.mark.asyncio
async def test_get_positions(portfolio_server):
    """Test getting portfolio positions."""
    async with grpc.aio.insecure_channel(portfolio_server) as channel:
        stub = portfolio_pb2_grpc.PortfolioServiceStub(channel)

        request = portfolio_pb2.GetPositionsRequest(account_id="test-account")
        response = await stub.GetPositions(request)

        assert isinstance(response.positions, list)
        assert response.total_positions >= 0


@pytest.mark.asyncio
async def test_get_summary(portfolio_server):
    """Test getting portfolio summary."""
    async with grpc.aio.insecure_channel(portfolio_server) as channel:
        stub = portfolio_pb2_grpc.PortfolioServiceStub(channel)

        request = portfolio_pb2.GetSummaryRequest(account_id="test-account")
        response = await stub.GetSummary(request)

        assert isinstance(response.portfolio_hash, str)
        assert response.total_value is not None
        assert response.position_count >= 0


@pytest.mark.asyncio
async def test_get_cash_balance(portfolio_server):
    """Test getting cash balance."""
    async with grpc.aio.insecure_channel(portfolio_server) as channel:
        stub = portfolio_pb2_grpc.PortfolioServiceStub(channel)

        request = portfolio_pb2.GetCashBalanceRequest(account_id="test-account")
        response = await stub.GetCashBalance(request)

        assert response.cash_balance is not None
        assert response.available_for_trading is not None
