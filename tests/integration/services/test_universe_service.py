"""Integration tests for Universe gRPC service."""

import grpc
import pytest

from contracts import universe_pb2  # type: ignore[attr-defined]
from contracts import universe_pb2_grpc  # type: ignore[attr-defined]


@pytest.mark.asyncio
async def test_universe_health_check(universe_server):
    """Test Universe service health check."""
    async with grpc.aio.insecure_channel(universe_server) as channel:
        stub = universe_pb2_grpc.UniverseServiceStub(channel)
        response = await stub.HealthCheck(universe_pb2.Empty())

        assert response.healthy is True
        assert response.version == "1.0.0"
        assert response.status == "OK"


@pytest.mark.asyncio
async def test_get_universe(universe_server):
    """Test getting all securities in universe."""
    async with grpc.aio.insecure_channel(universe_server) as channel:
        stub = universe_pb2_grpc.UniverseServiceStub(channel)

        request = universe_pb2.GetUniverseRequest(tradable_only=True)
        response = await stub.GetUniverse(request)

        assert isinstance(response.securities, list)
        assert response.total >= 0


@pytest.mark.asyncio
async def test_get_security(universe_server):
    """Test getting a specific security."""
    async with grpc.aio.insecure_channel(universe_server) as channel:
        stub = universe_pb2_grpc.UniverseServiceStub(channel)

        request = universe_pb2.GetSecurityRequest(isin="US0378331005")
        response = await stub.GetSecurity(request)

        assert isinstance(response.found, bool)


@pytest.mark.asyncio
async def test_sync_prices_streaming(universe_server):
    """Test syncing prices with streaming updates."""
    async with grpc.aio.insecure_channel(universe_server) as channel:
        stub = universe_pb2_grpc.UniverseServiceStub(channel)

        request = universe_pb2.SyncPricesRequest(isins=["US0378331005"])

        updates = []
        async for update in stub.SyncPrices(request):
            updates.append(update)

        # Should receive at least initial and completion updates
        assert len(updates) >= 2

        # Last update should be complete
        last_update = updates[-1]
        assert last_update.complete is True
        assert last_update.progress_pct == 100
