"""gRPC client for Gateway service."""

from typing import AsyncIterator, Dict

import grpc

from app.infrastructure.service_discovery import get_service_locator
from app.modules.gateway.services.gateway_service_interface import (
    SystemStatus,
    TradingCycleUpdate,
)
from contracts import gateway_pb2, gateway_pb2_grpc  # type: ignore[attr-defined]


class GrpcGatewayClient:
    """
    gRPC client for Gateway service.

    Implements GatewayServiceInterface over gRPC.
    """

    def __init__(self, channel: grpc.aio.Channel | None = None):
        """
        Initialize gRPC gateway client.

        Args:
            channel: Optional gRPC channel. If None, will create from service locator.
        """
        if channel is None:
            locator = get_service_locator()
            channel = locator.create_channel("gateway")

        self.stub = gateway_pb2_grpc.GatewayServiceStub(channel)

    async def get_system_status(self) -> SystemStatus:
        """
        Get system status.

        Returns:
            System status
        """
        grpc_request = gateway_pb2.GetSystemStatusRequest(include_details=True)

        try:
            grpc_response = await self.stub.GetSystemStatus(grpc_request)
            return SystemStatus(
                status=grpc_response.status,
                uptime_seconds=grpc_response.metrics.uptime_seconds,
                service_health={
                    svc.service_name: svc.healthy for svc in grpc_response.services
                },
            )
        except grpc.RpcError:
            return SystemStatus(
                status="down",
                uptime_seconds=0,
                service_health={},
            )

    async def trigger_trading_cycle(
        self, dry_run: bool = False
    ) -> AsyncIterator[TradingCycleUpdate]:
        """
        Trigger full trading cycle.

        Args:
            dry_run: Whether to run in dry-run mode

        Yields:
            Progress updates
        """
        grpc_request = gateway_pb2.TriggerTradingCycleRequest(
            dry_run=dry_run,
            force=False,
        )

        try:
            async for grpc_update in self.stub.TriggerTradingCycle(grpc_request):
                yield TradingCycleUpdate(
                    step=grpc_update.step,
                    progress_pct=grpc_update.progress_pct,
                    message=grpc_update.message,
                    complete=grpc_update.complete,
                    error=grpc_update.error if grpc_update.error else None,
                )
        except grpc.RpcError as e:
            yield TradingCycleUpdate(
                step="error",
                progress_pct=0,
                message=f"gRPC error: {e}",
                complete=True,
                error=str(e),
            )

    async def process_deposit(self, amount: float) -> Dict[str, float]:
        """
        Process a deposit.

        Args:
            amount: Deposit amount

        Returns:
            Dictionary with new cash balance
        """
        grpc_request = gateway_pb2.ProcessDepositRequest(
            amount=gateway_pb2.Money(amount=str(amount), currency="USD"),
            auto_invest=True,
        )

        try:
            grpc_response = await self.stub.ProcessDeposit(grpc_request)
            return {
                "cash_balance": float(grpc_response.new_cash_balance.amount),
            }
        except grpc.RpcError:
            return {"cash_balance": 0.0}
