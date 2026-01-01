"""Integration tests for Planning gRPC service."""

import grpc
import pytest

from contracts import planning_pb2  # type: ignore[attr-defined]
from contracts import planning_pb2_grpc  # type: ignore[attr-defined]


@pytest.mark.asyncio
async def test_planning_health_check(planning_server):
    """Test Planning service health check."""
    async with grpc.aio.insecure_channel(planning_server) as channel:
        stub = planning_pb2_grpc.PlanningServiceStub(channel)
        response = await stub.HealthCheck(planning_pb2.Empty())

        assert response.healthy is True
        assert response.version == "1.0.0"
        assert response.status == "OK"


@pytest.mark.asyncio
async def test_create_plan_streaming(planning_server):
    """Test creating a plan with streaming updates."""
    async with grpc.aio.insecure_channel(planning_server) as channel:
        stub = planning_pb2_grpc.PlanningServiceStub(channel)

        request = planning_pb2.CreatePlanRequest(
            portfolio_hash="test-hash-123",
            account_id="test-account",
            force_regenerate=False,
        )

        updates = []
        async for update in stub.CreatePlan(request):
            updates.append(update)

        # Should receive at least initial and completion updates
        assert len(updates) >= 2

        # First update should have 0 progress
        assert updates[0].progress_pct == 0

        # Last update should be complete
        last_update = updates[-1]
        assert last_update.complete is True
        assert last_update.progress_pct == 100


@pytest.mark.asyncio
async def test_get_plan(planning_server):
    """Test getting an existing plan."""
    async with grpc.aio.insecure_channel(planning_server) as channel:
        stub = planning_pb2_grpc.PlanningServiceStub(channel)

        request = planning_pb2.GetPlanRequest(portfolio_hash="test-hash-123")
        response = await stub.GetPlan(request)

        # Should return not found for non-existent plan
        assert response.found is False


@pytest.mark.asyncio
async def test_list_plans(planning_server):
    """Test listing all plans."""
    async with grpc.aio.insecure_channel(planning_server) as channel:
        stub = planning_pb2_grpc.PlanningServiceStub(channel)

        request = planning_pb2.ListPlansRequest(
            account_id="test-account", limit=10, offset=0
        )
        response = await stub.ListPlans(request)

        assert isinstance(response.plans, list)
        assert response.total >= 0
