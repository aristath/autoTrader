"""gRPC client for Portfolio service."""

from typing import List

import grpc

from app.infrastructure.service_discovery import get_service_locator
from app.modules.portfolio.services.portfolio_service_interface import (
    PortfolioPosition,
    PortfolioSummary,
)
from contracts import portfolio_pb2, portfolio_pb2_grpc  # type: ignore[attr-defined]


class GrpcPortfolioClient:
    """
    gRPC client for Portfolio service.

    Implements PortfolioServiceInterface over gRPC.
    """

    def __init__(self, channel: grpc.aio.Channel | None = None):
        """
        Initialize gRPC portfolio client.

        Args:
            channel: Optional gRPC channel. If None, will create from service locator.
        """
        if channel is None:
            locator = get_service_locator()
            channel = locator.create_channel("portfolio")

        self.stub = portfolio_pb2_grpc.PortfolioServiceStub(channel)

    async def get_positions(self, account_id: str) -> List[PortfolioPosition]:
        """
        Get current portfolio positions.

        Args:
            account_id: Account identifier

        Returns:
            List of positions
        """
        grpc_request = portfolio_pb2.GetPositionsRequest(account_id=account_id)

        try:
            grpc_response = await self.stub.GetPositions(grpc_request)
            return [
                PortfolioPosition(
                    symbol=pos.symbol,
                    isin=pos.isin,
                    quantity=pos.quantity,
                    average_price=float(pos.average_price.amount),
                    current_price=float(pos.current_price.amount),
                    market_value=float(pos.market_value.amount),
                    unrealized_pnl=float(pos.unrealized_pnl.amount),
                )
                for pos in grpc_response.positions
            ]
        except grpc.RpcError:
            return []

    async def get_summary(self, account_id: str) -> PortfolioSummary:
        """
        Get portfolio summary.

        Args:
            account_id: Account identifier

        Returns:
            Portfolio summary
        """
        grpc_request = portfolio_pb2.GetSummaryRequest(account_id=account_id)

        try:
            grpc_response = await self.stub.GetSummary(grpc_request)
            return PortfolioSummary(
                portfolio_hash=grpc_response.portfolio_hash,
                total_value=float(grpc_response.total_value.amount),
                cash_balance=float(grpc_response.cash_balance.amount),
                position_count=grpc_response.position_count,
                total_pnl=float(grpc_response.total_pnl.amount),
            )
        except grpc.RpcError:
            return PortfolioSummary(
                portfolio_hash="",
                total_value=0.0,
                cash_balance=0.0,
                position_count=0,
                total_pnl=0.0,
            )

    async def get_cash_balance(self, account_id: str) -> float:
        """
        Get cash balance.

        Args:
            account_id: Account identifier

        Returns:
            Cash balance
        """
        grpc_request = portfolio_pb2.GetCashBalanceRequest(account_id=account_id)

        try:
            grpc_response = await self.stub.GetCashBalance(grpc_request)
            return float(grpc_response.cash_balance.amount)
        except grpc.RpcError:
            return 0.0
