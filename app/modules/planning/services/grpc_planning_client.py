"""gRPC client for Planning service."""

from typing import AsyncIterator

import grpc

from app.infrastructure.service_discovery import get_service_locator
from app.modules.planning.domain.holistic_planner import HolisticPlan
from app.modules.planning.services.planning_service_interface import (
    PlanRequest,
    PlanUpdate,
)
from contracts import planning_pb2, planning_pb2_grpc  # type: ignore[attr-defined]


class GrpcPlanningClient:
    """
    gRPC client for Planning service.

    Implements PlanningServiceInterface over gRPC.
    """

    def __init__(self, channel: grpc.aio.Channel | None = None):
        """
        Initialize gRPC planning client.

        Args:
            channel: Optional gRPC channel. If None, will create from service locator.
        """
        if channel is None:
            locator = get_service_locator()
            channel = locator.create_channel("planning")

        self.stub = planning_pb2_grpc.PlanningServiceStub(channel)

    async def create_plan(self, request: PlanRequest) -> AsyncIterator[PlanUpdate]:
        """
        Create a new portfolio plan.

        Args:
            request: Planning request

        Yields:
            Progress updates
        """
        # Convert domain request to protobuf
        grpc_request = planning_pb2.CreatePlanRequest(
            portfolio_hash=request.portfolio_hash,
            available_cash=planning_pb2.Money(
                amount=str(request.available_cash),
                currency="USD",
            ),
            monthly_deposit=planning_pb2.Money(
                amount="0",
                currency="USD",
            ),
        )

        # Call gRPC streaming method
        async for grpc_update in self.stub.CreatePlan(grpc_request):
            # Convert protobuf response to domain model
            plan = None
            if grpc_update.complete and grpc_update.plan:
                # TODO: Convert protobuf Plan to HolisticPlan
                plan = None

            yield PlanUpdate(
                plan_id=grpc_update.plan_id,
                progress_pct=grpc_update.progress_pct,
                current_step=grpc_update.current_step,
                complete=grpc_update.complete,
                plan=plan,
                error=grpc_update.error if grpc_update.error else None,
            )

    async def get_plan(self, portfolio_hash: str) -> HolisticPlan | None:
        """
        Get an existing plan.

        Args:
            portfolio_hash: Portfolio identifier

        Returns:
            Plan if found, None otherwise
        """
        # Call gRPC method
        grpc_request = planning_pb2.GetPlanRequest(
            plan_id=portfolio_hash,
        )

        try:
            grpc_response = await self.stub.GetPlan(grpc_request)
            if grpc_response.found:
                # TODO: Convert protobuf Plan to HolisticPlan
                return None
            return None
        except grpc.RpcError:
            return None
