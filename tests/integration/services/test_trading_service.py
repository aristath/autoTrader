"""Integration tests for Trading gRPC service."""

import grpc
import pytest

from contracts import trading_pb2  # type: ignore[attr-defined]
from contracts import trading_pb2_grpc  # type: ignore[attr-defined]
from contracts.common import common_pb2  # type: ignore[attr-defined]


@pytest.mark.asyncio
async def test_trading_health_check(trading_server):
    """Test Trading service health check."""
    async with grpc.aio.insecure_channel(trading_server) as channel:
        stub = trading_pb2_grpc.TradingServiceStub(channel)
        response = await stub.HealthCheck(trading_pb2.Empty())

        assert response.healthy is True
        assert response.version == "1.0.0"
        assert response.status == "OK"


@pytest.mark.asyncio
async def test_execute_trade(trading_server):
    """Test executing a single trade."""
    async with grpc.aio.insecure_channel(trading_server) as channel:
        stub = trading_pb2_grpc.TradingServiceStub(channel)

        request = trading_pb2.ExecuteTradeRequest(
            account_id="test-account",
            isin="US0378331005",
            symbol="AAPL",
            side=trading_pb2.BUY,
            quantity=10.0,
            limit_price=common_pb2.Money(amount="150.00", currency="USD"),
        )
        response = await stub.ExecuteTrade(request)

        assert isinstance(response.success, bool)
        assert isinstance(response.trade_id, str)
        assert isinstance(response.message, str)


@pytest.mark.asyncio
async def test_batch_execute_trades(trading_server):
    """Test executing multiple trades."""
    async with grpc.aio.insecure_channel(trading_server) as channel:
        stub = trading_pb2_grpc.TradingServiceStub(channel)

        trades = [
            trading_pb2.ExecuteTradeRequest(
                account_id="test-account",
                isin="US0378331005",
                symbol="AAPL",
                side=trading_pb2.BUY,
                quantity=10.0,
            ),
            trading_pb2.ExecuteTradeRequest(
                account_id="test-account",
                isin="US5949181045",
                symbol="MSFT",
                side=trading_pb2.SELL,
                quantity=5.0,
            ),
        ]

        request = trading_pb2.BatchExecuteTradesRequest(trades=trades)
        response = await stub.BatchExecuteTrades(request)

        assert isinstance(response.all_success, bool)
        assert len(response.results) == len(trades)
        assert response.successful + response.failed == len(trades)


@pytest.mark.asyncio
async def test_validate_trade(trading_server):
    """Test trade validation."""
    async with grpc.aio.insecure_channel(trading_server) as channel:
        stub = trading_pb2_grpc.TradingServiceStub(channel)

        request = trading_pb2.ValidateTradeRequest(
            account_id="test-account",
            isin="US0378331005",
            symbol="AAPL",
            side=trading_pb2.BUY,
            quantity=10.0,
        )
        response = await stub.ValidateTrade(request)

        assert isinstance(response.valid, bool)
        assert isinstance(response.errors, list)
        assert isinstance(response.warnings, list)
