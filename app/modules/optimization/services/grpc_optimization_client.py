"""gRPC client for Optimization service."""

from typing import List

import grpc

from app.infrastructure.service_discovery import get_service_locator
from app.modules.optimization.services.optimization_service_interface import (
    AllocationTarget,
    OptimizationResult,
)
from contracts import (  # type: ignore[attr-defined]
    optimization_pb2,
    optimization_pb2_grpc,
)


class GrpcOptimizationClient:
    """
    gRPC client for Optimization service.

    Implements OptimizationServiceInterface over gRPC.
    """

    def __init__(self, channel: grpc.aio.Channel | None = None):
        """
        Initialize gRPC optimization client.

        Args:
            channel: Optional gRPC channel. If None, will create from service locator.
        """
        if channel is None:
            locator = get_service_locator()
            channel = locator.create_channel("optimization")

        self.stub = optimization_pb2_grpc.OptimizationServiceStub(channel)

    async def optimize_allocation(
        self,
        targets: List[AllocationTarget],
        available_cash: float,
    ) -> OptimizationResult:
        """
        Optimize portfolio allocation.

        Args:
            targets: Target allocations
            available_cash: Available cash

        Returns:
            Optimization result
        """
        grpc_targets = [
            optimization_pb2.SecurityAllocation(
                isin=t.isin,
                symbol=t.symbol,
                target_weight=t.target_weight,
            )
            for t in targets
        ]

        grpc_request = optimization_pb2.OptimizeAllocationRequest(
            portfolio_hash="",
            target_allocations=grpc_targets,
            available_cash=optimization_pb2.Money(
                amount=str(available_cash), currency="USD"
            ),
        )

        try:
            grpc_response = await self.stub.OptimizeAllocation(grpc_request)
            return OptimizationResult(
                success=grpc_response.success,
                message=grpc_response.solver_status,
                recommended_changes=[
                    {
                        "isin": change.isin,
                        "symbol": change.symbol,
                        "quantity_change": change.quantity_change,
                    }
                    for change in grpc_response.changes
                ],
                objective_value=(
                    grpc_response.objective_value
                    if grpc_response.objective_value
                    else None
                ),
            )
        except grpc.RpcError as e:
            return OptimizationResult(
                success=False,
                message=f"gRPC error: {e}",
                recommended_changes=[],
            )

    async def calculate_rebalancing(
        self,
        targets: List[AllocationTarget],
        available_cash: float,
    ) -> OptimizationResult:
        """
        Calculate optimal rebalancing.

        Args:
            targets: Target allocations
            available_cash: Available cash

        Returns:
            Rebalancing result
        """
        grpc_targets = [
            optimization_pb2.SecurityAllocation(
                isin=t.isin,
                symbol=t.symbol,
                target_weight=t.target_weight,
            )
            for t in targets
        ]

        grpc_request = optimization_pb2.CalculateRebalancingRequest(
            portfolio_hash="",
            target_allocations=grpc_targets,
            available_cash=optimization_pb2.Money(
                amount=str(available_cash), currency="USD"
            ),
        )

        try:
            grpc_response = await self.stub.CalculateRebalancing(grpc_request)
            return OptimizationResult(
                success=True,
                message=f"Drift: {grpc_response.total_drift_pct:.2%}",
                recommended_changes=[
                    {
                        "isin": change.isin,
                        "symbol": change.symbol,
                        "quantity_change": change.quantity_change,
                    }
                    for change in grpc_response.changes
                ],
            )
        except grpc.RpcError as e:
            return OptimizationResult(
                success=False,
                message=f"gRPC error: {e}",
                recommended_changes=[],
            )
