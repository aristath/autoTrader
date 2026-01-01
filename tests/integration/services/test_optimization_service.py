"""Integration tests for Optimization gRPC service."""

import grpc
import pytest

from contracts import optimization_pb2  # type: ignore[attr-defined]
from contracts import optimization_pb2_grpc  # type: ignore[attr-defined]
from contracts.common import common_pb2  # type: ignore[attr-defined]


@pytest.mark.asyncio
async def test_optimization_health_check(optimization_server):
    """Test Optimization service health check."""
    async with grpc.aio.insecure_channel(optimization_server) as channel:
        stub = optimization_pb2_grpc.OptimizationServiceStub(channel)
        response = await stub.HealthCheck(optimization_pb2.Empty())

        assert response.healthy is True
        assert response.version == "1.0.0"
        assert response.status == "OK"


@pytest.mark.asyncio
async def test_optimize_allocation(optimization_server):
    """Test optimizing portfolio allocation."""
    async with grpc.aio.insecure_channel(optimization_server) as channel:
        stub = optimization_pb2_grpc.OptimizationServiceStub(channel)

        targets = [
            optimization_pb2.SecurityAllocation(
                isin="US0378331005",
                symbol="AAPL",
                target_weight=0.3,
                current_weight=0.2,
            ),
            optimization_pb2.SecurityAllocation(
                isin="US5949181045",
                symbol="MSFT",
                target_weight=0.3,
                current_weight=0.3,
            ),
        ]

        request = optimization_pb2.OptimizeAllocationRequest(
            target_allocations=targets,
            available_cash=common_pb2.Money(amount="10000.00", currency="USD"),
        )
        response = await stub.OptimizeAllocation(request)

        assert isinstance(response.success, bool)
        assert isinstance(response.changes, list)
        assert isinstance(response.solver_status, str)


@pytest.mark.asyncio
async def test_calculate_rebalancing(optimization_server):
    """Test calculating rebalancing needs."""
    async with grpc.aio.insecure_channel(optimization_server) as channel:
        stub = optimization_pb2_grpc.OptimizationServiceStub(channel)

        targets = [
            optimization_pb2.SecurityAllocation(
                isin="US0378331005",
                symbol="AAPL",
                target_weight=0.3,
                current_weight=0.4,
            ),
        ]

        request = optimization_pb2.CalculateRebalancingRequest(
            target_allocations=targets,
            available_cash=common_pb2.Money(amount="5000.00", currency="USD"),
        )
        response = await stub.CalculateRebalancing(request)

        assert isinstance(response.needs_rebalancing, bool)
        assert isinstance(response.changes, list)
        assert isinstance(response.total_drift_pct, float)
