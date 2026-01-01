"""End-to-end test for complete trading workflow across services."""

from concurrent import futures

import grpc
import pytest

from contracts import (  # type: ignore[attr-defined]
    gateway_pb2,
    gateway_pb2_grpc,
    portfolio_pb2,
    portfolio_pb2_grpc,
    scoring_pb2,
    scoring_pb2_grpc,
    universe_pb2,
    universe_pb2_grpc,
)
from services.gateway.grpc_servicer import GatewayServicer
from services.portfolio.grpc_servicer import PortfolioServicer
from services.scoring.grpc_servicer import ScoringServicer
from services.universe.grpc_servicer import UniverseServicer


@pytest.fixture
async def multi_service_environment():
    """Create a test environment with multiple services running."""
    # Create servers
    gateway_server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=2))
    portfolio_server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=2))
    universe_server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=2))
    scoring_server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=2))

    # Add servicers
    gateway_pb2_grpc.add_GatewayServiceServicer_to_server(
        GatewayServicer(), gateway_server
    )
    portfolio_pb2_grpc.add_PortfolioServiceServicer_to_server(
        PortfolioServicer(), portfolio_server
    )
    universe_pb2_grpc.add_UniverseServiceServicer_to_server(
        UniverseServicer(), universe_server
    )
    scoring_pb2_grpc.add_ScoringServiceServicer_to_server(
        ScoringServicer(), scoring_server
    )

    # Start servers
    gateway_port = gateway_server.add_insecure_port("[::]:0")
    portfolio_port = portfolio_server.add_insecure_port("[::]:0")
    universe_port = universe_server.add_insecure_port("[::]:0")
    scoring_port = scoring_server.add_insecure_port("[::]:0")

    await gateway_server.start()
    await portfolio_server.start()
    await universe_server.start()
    await scoring_server.start()

    ports = {
        "gateway": f"localhost:{gateway_port}",
        "portfolio": f"localhost:{portfolio_port}",
        "universe": f"localhost:{universe_port}",
        "scoring": f"localhost:{scoring_port}",
    }

    yield ports

    # Stop servers
    await gateway_server.stop(grace=0)
    await portfolio_server.stop(grace=0)
    await universe_server.stop(grace=0)
    await scoring_server.stop(grace=0)


@pytest.mark.asyncio
async def test_complete_trading_workflow(multi_service_environment):
    """Test a complete trading workflow across multiple services."""
    ports = multi_service_environment

    # Step 1: Check portfolio status
    async with grpc.aio.insecure_channel(ports["portfolio"]) as channel:
        portfolio_stub = portfolio_pb2_grpc.PortfolioServiceStub(channel)
        summary = await portfolio_stub.GetSummary(
            portfolio_pb2.GetSummaryRequest(account_id="test-account")
        )
        assert summary.portfolio_hash is not None

    # Step 2: Get universe of securities
    async with grpc.aio.insecure_channel(ports["universe"]) as channel:
        universe_stub = universe_pb2_grpc.UniverseServiceStub(channel)
        universe = await universe_stub.GetUniverse(
            universe_pb2.GetUniverseRequest(tradable_only=True)
        )
        assert universe.total >= 0

    # Step 3: Score securities
    async with grpc.aio.insecure_channel(ports["scoring"]) as channel:
        scoring_stub = scoring_pb2_grpc.ScoringServiceStub(channel)
        scores = await scoring_stub.BatchScoreSecurities(
            scoring_pb2.BatchScoreSecuritiesRequest(
                isins=["US0378331005", "US5949181045"]
            )
        )
        assert scores.total_scored >= 0

    # Step 4: Check system status via Gateway
    async with grpc.aio.insecure_channel(ports["gateway"]) as channel:
        gateway_stub = gateway_pb2_grpc.GatewayServiceStub(channel)
        status = await gateway_stub.GetSystemStatus(
            gateway_pb2.GetSystemStatusRequest()
        )
        assert isinstance(status.system_healthy, bool)


@pytest.mark.asyncio
async def test_health_checks_across_services(multi_service_environment):
    """Test that all services respond to health checks."""
    ports = multi_service_environment

    services = [
        ("gateway", gateway_pb2_grpc.GatewayServiceStub, gateway_pb2),
        ("portfolio", portfolio_pb2_grpc.PortfolioServiceStub, portfolio_pb2),
        ("universe", universe_pb2_grpc.UniverseServiceStub, universe_pb2),
        ("scoring", scoring_pb2_grpc.ScoringServiceStub, scoring_pb2),
    ]

    for service_name, stub_class, pb2_module in services:
        async with grpc.aio.insecure_channel(ports[service_name]) as channel:
            stub = stub_class(channel)
            response = await stub.HealthCheck(pb2_module.Empty())
            assert response.healthy is True
            assert response.version == "1.0.0"
            assert response.status == "OK"
