"""Integration tests for Gateway gRPC service."""

import grpc
import pytest

from contracts import gateway_pb2  # type: ignore[attr-defined]
from contracts import gateway_pb2_grpc  # type: ignore[attr-defined]
from contracts.common import common_pb2  # type: ignore[attr-defined]


@pytest.mark.asyncio
async def test_gateway_health_check(gateway_server):
    """Test Gateway service health check."""
    async with grpc.aio.insecure_channel(gateway_server) as channel:
        stub = gateway_pb2_grpc.GatewayServiceStub(channel)
        response = await stub.HealthCheck(gateway_pb2.Empty())

        assert response.healthy is True
        assert response.version == "1.0.0"
        assert response.status == "OK"


@pytest.mark.asyncio
async def test_get_system_status(gateway_server):
    """Test getting system status."""
    async with grpc.aio.insecure_channel(gateway_server) as channel:
        stub = gateway_pb2_grpc.GatewayServiceStub(channel)

        request = gateway_pb2.GetSystemStatusRequest()
        response = await stub.GetSystemStatus(request)

        assert isinstance(response.system_healthy, bool)
        assert isinstance(response.services, list)
        assert isinstance(response.overall_message, str)


@pytest.mark.asyncio
async def test_trigger_trading_cycle_streaming(gateway_server):
    """Test triggering a trading cycle with streaming updates."""
    async with grpc.aio.insecure_channel(gateway_server) as channel:
        stub = gateway_pb2_grpc.GatewayServiceStub(channel)

        request = gateway_pb2.TriggerTradingCycleRequest(
            force=False,
            deposit_amount=common_pb2.Money(amount="1000.00", currency="USD"),
        )

        updates = []
        async for update in stub.TriggerTradingCycle(request):
            updates.append(update)

        # Should receive at least one update
        assert len(updates) >= 1

        # Last update should be complete
        last_update = updates[-1]
        assert last_update.complete is True


@pytest.mark.asyncio
async def test_process_deposit(gateway_server):
    """Test processing a deposit."""
    async with grpc.aio.insecure_channel(gateway_server) as channel:
        stub = gateway_pb2_grpc.GatewayServiceStub(channel)

        request = gateway_pb2.ProcessDepositRequest(
            account_id="test-account",
            amount=common_pb2.Money(amount="1000.00", currency="USD"),
        )
        response = await stub.ProcessDeposit(request)

        assert isinstance(response.success, bool)
        assert response.new_balance is not None
        assert isinstance(response.message, str)
