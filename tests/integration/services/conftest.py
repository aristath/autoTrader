"""Common fixtures for service integration tests."""

from concurrent import futures

import grpc
import pytest

from contracts import (  # type: ignore[attr-defined]
    gateway_pb2_grpc,
    optimization_pb2_grpc,
    planning_pb2_grpc,
    portfolio_pb2_grpc,
    scoring_pb2_grpc,
    trading_pb2_grpc,
    universe_pb2_grpc,
)
from services.gateway.grpc_servicer import GatewayServicer
from services.optimization.grpc_servicer import OptimizationServicer
from services.planning.grpc_servicer import PlanningServicer
from services.portfolio.grpc_servicer import PortfolioServicer
from services.scoring.grpc_servicer import ScoringServicer
from services.trading.grpc_servicer import TradingServicer
from services.universe.grpc_servicer import UniverseServicer


@pytest.fixture
async def planning_server():
    """Create a test Planning gRPC server."""
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=2))
    planning_pb2_grpc.add_PlanningServiceServicer_to_server(PlanningServicer(), server)
    port = server.add_insecure_port("[::]:0")
    await server.start()

    yield f"localhost:{port}"

    await server.stop(grace=0)


@pytest.fixture
async def scoring_server():
    """Create a test Scoring gRPC server."""
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=2))
    scoring_pb2_grpc.add_ScoringServiceServicer_to_server(ScoringServicer(), server)
    port = server.add_insecure_port("[::]:0")
    await server.start()

    yield f"localhost:{port}"

    await server.stop(grace=0)


@pytest.fixture
async def portfolio_server():
    """Create a test Portfolio gRPC server."""
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=2))
    portfolio_pb2_grpc.add_PortfolioServiceServicer_to_server(
        PortfolioServicer(), server
    )
    port = server.add_insecure_port("[::]:0")
    await server.start()

    yield f"localhost:{port}"

    await server.stop(grace=0)


@pytest.fixture
async def trading_server():
    """Create a test Trading gRPC server."""
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=2))
    trading_pb2_grpc.add_TradingServiceServicer_to_server(TradingServicer(), server)
    port = server.add_insecure_port("[::]:0")
    await server.start()

    yield f"localhost:{port}"

    await server.stop(grace=0)


@pytest.fixture
async def universe_server():
    """Create a test Universe gRPC server."""
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=2))
    universe_pb2_grpc.add_UniverseServiceServicer_to_server(UniverseServicer(), server)
    port = server.add_insecure_port("[::]:0")
    await server.start()

    yield f"localhost:{port}"

    await server.stop(grace=0)


@pytest.fixture
async def optimization_server():
    """Create a test Optimization gRPC server."""
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=2))
    optimization_pb2_grpc.add_OptimizationServiceServicer_to_server(
        OptimizationServicer(), server
    )
    port = server.add_insecure_port("[::]:0")
    await server.start()

    yield f"localhost:{port}"

    await server.stop(grace=0)


@pytest.fixture
async def gateway_server():
    """Create a test Gateway gRPC server."""
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=2))
    gateway_pb2_grpc.add_GatewayServiceServicer_to_server(GatewayServicer(), server)
    port = server.add_insecure_port("[::]:0")
    await server.start()

    yield f"localhost:{port}"

    await server.stop(grace=0)
