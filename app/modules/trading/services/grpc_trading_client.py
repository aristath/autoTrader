"""gRPC client for Trading service."""

from typing import List

import grpc

from app.infrastructure.service_discovery import get_service_locator
from app.modules.trading.services.trading_service_interface import (
    TradeRequest,
    TradeResult,
)
from contracts import trading_pb2, trading_pb2_grpc  # type: ignore[attr-defined]


class GrpcTradingClient:
    """
    gRPC client for Trading service.

    Implements TradingServiceInterface over gRPC.
    """

    def __init__(self, channel: grpc.aio.Channel | None = None):
        """
        Initialize gRPC trading client.

        Args:
            channel: Optional gRPC channel. If None, will create from service locator.
        """
        if channel is None:
            locator = get_service_locator()
            channel = locator.create_channel("trading")

        self.stub = trading_pb2_grpc.TradingServiceStub(channel)

    async def execute_trade(self, request: TradeRequest) -> TradeResult:
        """
        Execute a single trade.

        Args:
            request: Trade request

        Returns:
            Trade execution result
        """
        # Map side to protobuf enum
        side_map = {"BUY": trading_pb2.BUY, "SELL": trading_pb2.SELL}

        grpc_request = trading_pb2.ExecuteTradeRequest(
            account_id=request.account_id,
            isin=request.isin,
            symbol=request.symbol,
            side=side_map.get(request.side, trading_pb2.TRADE_SIDE_UNSPECIFIED),
            quantity=request.quantity,
            order_type=trading_pb2.MARKET,
        )

        if request.limit_price:
            grpc_request.order_type = trading_pb2.LIMIT
            grpc_request.limit_price.amount = str(request.limit_price)
            grpc_request.limit_price.currency = "USD"

        try:
            grpc_response = await self.stub.ExecuteTrade(grpc_request)
            return TradeResult(
                trade_id=grpc_response.trade_id,
                success=grpc_response.success,
                message=grpc_response.message,
                executed_quantity=(
                    grpc_response.execution.quantity_filled
                    if grpc_response.execution
                    else 0.0
                ),
                executed_price=(
                    float(grpc_response.execution.average_price.amount)
                    if grpc_response.execution
                    else None
                ),
            )
        except grpc.RpcError as e:
            return TradeResult(
                trade_id="",
                success=False,
                message=f"gRPC error: {e}",
                executed_quantity=0.0,
            )

    async def batch_execute_trades(
        self, requests: List[TradeRequest]
    ) -> List[TradeResult]:
        """
        Execute multiple trades.

        Args:
            requests: List of trade requests

        Returns:
            List of trade results
        """
        # Convert all requests
        grpc_requests = []
        for req in requests:
            side_map = {"BUY": trading_pb2.BUY, "SELL": trading_pb2.SELL}
            grpc_req = trading_pb2.ExecuteTradeRequest(
                account_id=req.account_id,
                isin=req.isin,
                symbol=req.symbol,
                side=side_map.get(req.side, trading_pb2.TRADE_SIDE_UNSPECIFIED),
                quantity=req.quantity,
                order_type=trading_pb2.MARKET,
            )
            grpc_requests.append(grpc_req)

        grpc_batch_request = trading_pb2.BatchExecuteTradesRequest(
            account_id=requests[0].account_id if requests else "",
            trades=grpc_requests,
        )

        try:
            grpc_response = await self.stub.BatchExecuteTrades(grpc_batch_request)
            return [
                TradeResult(
                    trade_id=result.trade_id,
                    success=result.success,
                    message=result.message,
                    executed_quantity=(
                        result.execution.quantity_filled if result.execution else 0.0
                    ),
                    executed_price=(
                        float(result.execution.average_price.amount)
                        if result.execution
                        else None
                    ),
                )
                for result in grpc_response.results
            ]
        except grpc.RpcError:
            return []
