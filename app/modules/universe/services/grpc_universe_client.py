"""gRPC client for Universe service."""

from typing import List, Optional

import grpc

from app.infrastructure.service_discovery import get_service_locator
from app.modules.universe.services.universe_service_interface import UniverseSecurity
from contracts import universe_pb2, universe_pb2_grpc  # type: ignore[attr-defined]


class GrpcUniverseClient:
    """
    gRPC client for Universe service.

    Implements UniverseServiceInterface over gRPC.
    """

    def __init__(self, channel: grpc.aio.Channel | None = None):
        """
        Initialize gRPC universe client.

        Args:
            channel: Optional gRPC channel. If None, will create from service locator.
        """
        if channel is None:
            locator = get_service_locator()
            channel = locator.create_channel("universe")

        self.stub = universe_pb2_grpc.UniverseServiceStub(channel)

    async def get_security(self, isin: str) -> Optional[UniverseSecurity]:
        """
        Get a security by ISIN.

        Args:
            isin: Security ISIN

        Returns:
            Security if found, None otherwise
        """
        grpc_request = universe_pb2.GetSecurityRequest(isin=isin)

        try:
            grpc_response = await self.stub.GetSecurity(grpc_request)
            if grpc_response.found:
                sec = grpc_response.security
                return UniverseSecurity(
                    isin=sec.isin,
                    symbol=sec.symbol,
                    name=sec.name,
                    exchange=sec.exchange,
                    current_price=(
                        float(sec.current_price.amount) if sec.current_price else None
                    ),
                    is_tradable=sec.is_tradable,
                )
            return None
        except grpc.RpcError:
            return None

    async def get_universe(self, tradable_only: bool = True) -> List[UniverseSecurity]:
        """
        Get all securities in universe.

        Args:
            tradable_only: Only return tradable securities

        Returns:
            List of securities
        """
        grpc_request = universe_pb2.GetUniverseRequest(tradable_only=tradable_only)

        try:
            grpc_response = await self.stub.GetUniverse(grpc_request)
            return [
                UniverseSecurity(
                    isin=sec.isin,
                    symbol=sec.symbol,
                    name=sec.name,
                    exchange=sec.exchange,
                    current_price=(
                        float(sec.current_price.amount) if sec.current_price else None
                    ),
                    is_tradable=sec.is_tradable,
                )
                for sec in grpc_response.securities
            ]
        except grpc.RpcError:
            return []

    async def sync_prices(self, isins: Optional[List[str]] = None) -> int:
        """
        Sync prices from external APIs.

        Args:
            isins: List of ISINs to sync, or None for all

        Returns:
            Number of securities synced
        """
        grpc_request = universe_pb2.SyncPricesRequest(
            isins=isins if isins else [],
            force_refresh=False,
        )

        try:
            # This is a streaming RPC, consume all updates
            synced_count = 0
            async for update in self.stub.SyncPrices(grpc_request):
                if update.complete:
                    synced_count = update.synced
            return synced_count
        except grpc.RpcError:
            return 0
