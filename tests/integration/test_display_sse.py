"""Integration tests for LED display SSE endpoint.

These tests validate the SSE streaming endpoint for real-time display updates.
Note: Full SSE streaming tests are challenging with TestClient due to the
infinite nature of SSE streams. The core SSE logic is tested in unit tests
(test_display_events.py). These integration tests verify endpoint configuration.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.status import router
from app.infrastructure.dependencies import (
    get_display_state_manager,
    get_settings_repository,
)


@pytest.fixture
def mock_settings_repo():
    """Mock settings repository."""
    repo = AsyncMock()
    repo.get_float = AsyncMock(return_value=50.0)
    return repo


@pytest.fixture
def mock_display_manager():
    """Mock display state manager."""
    manager = MagicMock()
    manager.get_error_text = MagicMock(return_value="")
    manager.get_processing_text = MagicMock(return_value="")
    manager.get_next_actions_text = MagicMock(return_value="Portfolio EUR12345")
    return manager


@pytest.fixture
def app(mock_settings_repo, mock_display_manager):
    """Create a test FastAPI app with dependency overrides."""
    test_app = FastAPI()
    test_app.include_router(router, prefix="/api/status")

    # Override dependencies to use mocks
    test_app.dependency_overrides[get_settings_repository] = lambda: mock_settings_repo
    test_app.dependency_overrides[get_display_state_manager] = (
        lambda: mock_display_manager
    )

    return test_app


class TestSSEEndpointConfiguration:
    """Test SSE endpoint configuration and routing."""

    def test_sse_endpoint_exists(self, app):
        """Test that the SSE endpoint is registered."""
        # Get all routes from the app
        routes = [route.path for route in app.routes]
        assert "/api/status/led/display/stream" in routes

    def test_sse_endpoint_is_get_method(self, app):
        """Test that SSE endpoint accepts GET method."""
        for route in app.routes:
            if route.path == "/api/status/led/display/stream":
                assert "GET" in route.methods
                break

    def test_display_text_endpoint_works(self, app, mock_settings_repo):
        """Test that related display text endpoint works correctly."""
        # This tests a non-streaming endpoint in the same router
        with patch(
            "app.infrastructure.hardware.display_service.get_current_text",
            return_value="Test text",
        ):
            client = TestClient(app)
            response = client.get("/api/status/display/text")
            assert response.status_code == 200
            data = response.json()
            assert "text" in data
            assert "speed" in data
            assert "brightness" in data


class TestSSEEventFormat:
    """Test SSE event formatting (using direct function calls)."""

    def test_get_display_state_data_format(self, mock_display_manager):
        """Test that display state data has correct format."""
        from app.infrastructure.hardware.display_events import _get_display_state_data

        data = _get_display_state_data(mock_display_manager, ticker_speed=50)

        assert "mode" in data
        assert "error_message" in data
        assert "activity_message" in data
        assert "ticker_text" in data
        assert "ticker_speed" in data
        assert "led3" in data
        assert "led4" in data
        assert isinstance(data["led3"], list)
        assert isinstance(data["led4"], list)
        assert len(data["led3"]) == 3
        assert len(data["led4"]) == 3

    def test_get_display_state_data_normal_mode(self, mock_display_manager):
        """Test normal mode when no error or processing."""
        from app.infrastructure.hardware.display_events import _get_display_state_data

        mock_display_manager.get_error_text.return_value = ""
        mock_display_manager.get_processing_text.return_value = ""

        data = _get_display_state_data(mock_display_manager)
        assert data["mode"] == "normal"

    def test_get_display_state_data_error_mode(self, mock_display_manager):
        """Test error mode when error text is present."""
        from app.infrastructure.hardware.display_events import _get_display_state_data

        mock_display_manager.get_error_text.return_value = "Error occurred"
        mock_display_manager.get_processing_text.return_value = ""

        data = _get_display_state_data(mock_display_manager)
        assert data["mode"] == "error"
        assert data["error_message"] == "Error occurred"

    def test_get_display_state_data_activity_mode(self, mock_display_manager):
        """Test activity mode when processing text is present."""
        from app.infrastructure.hardware.display_events import _get_display_state_data

        mock_display_manager.get_error_text.return_value = ""
        mock_display_manager.get_processing_text.return_value = "Processing..."

        data = _get_display_state_data(mock_display_manager)
        assert data["mode"] == "activity"
        assert data["activity_message"] == "Processing..."

    def test_get_display_state_data_ticker_text(self, mock_display_manager):
        """Test that ticker text is included."""
        from app.infrastructure.hardware.display_events import _get_display_state_data

        mock_display_manager.get_next_actions_text.return_value = "BUY AAPL EUR100"

        data = _get_display_state_data(mock_display_manager)
        assert data["ticker_text"] == "BUY AAPL EUR100"

    def test_get_display_state_data_ticker_speed(self, mock_display_manager):
        """Test that ticker speed is passed through."""
        from app.infrastructure.hardware.display_events import _get_display_state_data

        data = _get_display_state_data(mock_display_manager, ticker_speed=75)
        assert data["ticker_speed"] == 75
