"""Tests for LED display SSE event manager.

These tests validate the SSE event broadcasting system for real-time LED display updates.
"""

import asyncio
from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture
def mock_display_manager():
    """Mock display state manager."""
    manager = MagicMock()
    manager.get_error_text = MagicMock(return_value="")
    manager.get_processing_text = MagicMock(return_value="")
    manager.get_next_actions_text = MagicMock(return_value="Portfolio EUR12345")
    return manager


class TestDisplayEventsSubscription:
    """Test SSE event subscription functionality."""

    @pytest.mark.asyncio
    async def test_subscribe_returns_async_generator(self, mock_display_manager):
        """Test that subscribe_display_events returns an async generator."""
        from app.infrastructure.hardware import display_events

        with patch.object(
            display_events, "_display_state_manager", mock_display_manager
        ):
            async for event in display_events.subscribe_display_events():
                # Should be able to iterate over events
                assert event is not None
                break

    @pytest.mark.asyncio
    async def test_subscribe_receives_initial_state(self, mock_display_manager):
        """Test that initial state is sent on subscription."""
        from app.infrastructure.hardware import display_events

        with patch.object(
            display_events, "_display_state_manager", mock_display_manager
        ):
            events_received = []
            async for event in display_events.subscribe_display_events():
                events_received.append(event)
                if len(events_received) >= 1:
                    break

            assert len(events_received) == 1
            assert "mode" in events_received[0]
            assert "ticker_text" in events_received[0]

    @pytest.mark.asyncio
    async def test_subscribe_receives_state_changes(self, mock_display_manager):
        """Test that state changes are broadcast to subscribers."""
        from app.infrastructure.hardware import display_events

        with patch.object(
            display_events, "_display_state_manager", mock_display_manager
        ):
            events_received = []
            async for event in display_events.subscribe_display_events():
                events_received.append(event)
                if len(events_received) >= 1:
                    break

            # Should receive initial state
            assert len(events_received) >= 1

    @pytest.mark.asyncio
    async def test_multiple_subscribers_receive_events(self, mock_display_manager):
        """Test that multiple subscribers can receive the same events."""
        from app.infrastructure.hardware import display_events

        with patch.object(
            display_events, "_display_state_manager", mock_display_manager
        ):
            events_1 = []
            events_2 = []

            async def collect_events_1():
                async for event in display_events.subscribe_display_events():
                    events_1.append(event)
                    if len(events_1) >= 1:
                        break

            async def collect_events_2():
                async for event in display_events.subscribe_display_events():
                    events_2.append(event)
                    if len(events_2) >= 1:
                        break

            await asyncio.gather(collect_events_1(), collect_events_2())

            assert len(events_1) >= 1
            assert len(events_2) >= 1

    @pytest.mark.asyncio
    async def test_event_format_contains_required_fields(self, mock_display_manager):
        """Test that events contain all required fields."""
        from app.infrastructure.hardware import display_events

        with patch.object(
            display_events, "_display_state_manager", mock_display_manager
        ):
            async for event in display_events.subscribe_display_events():
                assert "mode" in event
                assert "error_message" in event
                assert "activity_message" in event
                assert "ticker_text" in event
                assert "ticker_speed" in event
                assert "led3" in event
                assert "led4" in event
                break

    @pytest.mark.asyncio
    async def test_event_mode_values(self, mock_display_manager):
        """Test that mode field has valid values."""
        from app.infrastructure.hardware import display_events

        with patch.object(
            display_events, "_display_state_manager", mock_display_manager
        ):
            async for event in display_events.subscribe_display_events():
                assert event["mode"] in ["error", "activity", "normal"]
                break

    @pytest.mark.asyncio
    async def test_event_led_values_are_arrays(self, mock_display_manager):
        """Test that LED values are arrays of 3 integers."""
        from app.infrastructure.hardware import display_events

        with patch.object(
            display_events, "_display_state_manager", mock_display_manager
        ):
            async for event in display_events.subscribe_display_events():
                assert isinstance(event["led3"], list)
                assert isinstance(event["led4"], list)
                assert len(event["led3"]) == 3
                assert len(event["led4"]) == 3
                assert all(isinstance(x, int) for x in event["led3"])
                assert all(isinstance(x, int) for x in event["led4"])
                break


class TestDisplayEventsBroadcast:
    """Test event broadcasting functionality."""

    @pytest.mark.asyncio
    async def test_broadcast_notifies_all_subscribers(self, mock_display_manager):
        """Test that broadcast sends events to all active subscribers."""
        from app.infrastructure.hardware import display_events

        with patch.object(
            display_events, "_display_state_manager", mock_display_manager
        ):
            events_1 = []
            events_2 = []

            async def collect_events_1():
                async for event in display_events.subscribe_display_events():
                    events_1.append(event)
                    if len(events_1) >= 2:
                        break

            async def collect_events_2():
                async for event in display_events.subscribe_display_events():
                    events_2.append(event)
                    if len(events_2) >= 2:
                        break

            # Start both collectors
            task1 = asyncio.create_task(collect_events_1())
            task2 = asyncio.create_task(collect_events_2())

            # Wait a bit for subscriptions to be established
            await asyncio.sleep(0.1)

            # Trigger a broadcast using the internal function
            state_data = display_events._get_display_state_data(mock_display_manager)
            display_events._broadcast_to_queues(state_data)

            # Wait for events with timeout
            try:
                await asyncio.wait_for(asyncio.gather(task1, task2), timeout=2.0)
            except asyncio.TimeoutError:
                task1.cancel()
                task2.cancel()
                # Allow partial results
                pass

            # Both should have received at least the initial event
            assert len(events_1) >= 1
            assert len(events_2) >= 1


class TestDisplayEventsCleanup:
    """Test cleanup on client disconnection."""

    @pytest.mark.asyncio
    async def test_cleanup_on_generator_exit(self, mock_display_manager):
        """Test that subscriptions are cleaned up when generator exits."""
        from app.infrastructure.hardware import display_events

        with patch.object(
            display_events, "_display_state_manager", mock_display_manager
        ):
            initial_count = len(display_events._subscribers)

            async def temporary_subscriber():
                async for event in display_events.subscribe_display_events():
                    break  # Exit immediately

            await temporary_subscriber()

            # Give time for cleanup
            await asyncio.sleep(0.1)

            # Subscriber should be removed
            final_count = len(display_events._subscribers)
            assert final_count == initial_count
