"""Tests for rate limiting infrastructure.

These tests validate rate limiting functionality to prevent excessive API calls
and ensure proper throttling behavior.
"""

import asyncio
import time
from unittest.mock import MagicMock, patch

import pytest

from app.infrastructure.rate_limit import RateLimiter


class TestRateLimiter:
    """Test RateLimiter class."""

    def test_init_with_custom_limits(self):
        """Test RateLimiter initialization with custom limits."""
        limiter = RateLimiter(calls_per_second=10, burst_size=5)
        assert limiter._calls_per_second == 10
        assert limiter._burst_size == 5

    def test_init_with_defaults(self):
        """Test RateLimiter initialization with default values."""
        limiter = RateLimiter()
        assert limiter._calls_per_second > 0
        assert limiter._burst_size > 0

    @pytest.mark.asyncio
    async def test_allows_burst_calls(self):
        """Test that burst size allows rapid initial calls."""
        limiter = RateLimiter(calls_per_second=1, burst_size=3)

        # Should allow burst_size calls immediately
        for i in range(3):
            allowed = await limiter.acquire()
            assert allowed is True

    @pytest.mark.asyncio
    async def test_throttles_after_burst(self):
        """Test that calls are throttled after burst is exhausted."""
        limiter = RateLimiter(calls_per_second=10, burst_size=2)

        # Consume burst
        await limiter.acquire()
        await limiter.acquire()

        # Next call should be throttled (will take time)
        start_time = time.time()
        await limiter.acquire()
        elapsed = time.time() - start_time

        # Should have been delayed (at least some small amount)
        assert elapsed > 0

    @pytest.mark.asyncio
    async def test_context_manager_acquires_and_releases(self):
        """Test RateLimiter as async context manager."""
        limiter = RateLimiter(calls_per_second=10, burst_size=1)

        async with limiter:
            # Should acquire successfully
            pass

        # Should have released and allow another call
        async with limiter:
            pass

    @pytest.mark.asyncio
    async def test_respects_calls_per_second(self):
        """Test that rate limiter respects calls_per_second limit."""
        limiter = RateLimiter(calls_per_second=2, burst_size=1)

        # Make first call (burst)
        await limiter.acquire()

        # Make multiple rapid calls - should be throttled
        call_times = []
        for _ in range(3):
            start = time.time()
            await limiter.acquire()
            call_times.append(time.time() - start)

        # Subsequent calls should be spaced out
        # (Allow some tolerance for timing)
        assert sum(call_times) >= 0.4  # At least 0.2s between calls for 2/sec

    @pytest.mark.asyncio
    async def test_handles_concurrent_requests(self):
        """Test rate limiter with concurrent requests."""
        limiter = RateLimiter(calls_per_second=10, burst_size=5)

        # Make concurrent requests
        async def make_request():
            async with limiter:
                return True

        results = await asyncio.gather(*[make_request() for _ in range(10)])

        # All should succeed (within burst + rate limit)
        assert all(results)
        assert len(results) == 10

    @pytest.mark.asyncio
    async def test_allows_single_call_per_second(self):
        """Test rate limiter with very restrictive limit (1 call/second)."""
        limiter = RateLimiter(calls_per_second=1, burst_size=1)

        # First call should succeed immediately
        start = time.time()
        await limiter.acquire()
        first_call_time = time.time() - start
        assert first_call_time < 0.1  # Should be fast (burst)

        # Second call should wait approximately 1 second
        start = time.time()
        await limiter.acquire()
        second_call_time = time.time() - start
        assert second_call_time >= 0.9  # Should wait ~1 second

    @pytest.mark.asyncio
    async def test_resets_over_time(self):
        """Test that rate limiter allows more calls after time passes."""
        limiter = RateLimiter(calls_per_second=2, burst_size=1)

        # Consume burst
        await limiter.acquire()

        # Wait a bit and acquire again
        await asyncio.sleep(0.6)  # Half a second
        await limiter.acquire()

        # Should be able to acquire again soon (token bucket refills)
        await asyncio.sleep(0.6)
        await limiter.acquire()

    def test_negative_limits_raise_error(self):
        """Test that negative limits raise ValueError."""
        with pytest.raises(ValueError):
            RateLimiter(calls_per_second=-1)

        with pytest.raises(ValueError):
            RateLimiter(burst_size=-1)

    def test_zero_limits_raise_error(self):
        """Test that zero limits raise ValueError."""
        with pytest.raises(ValueError):
            RateLimiter(calls_per_second=0)

        with pytest.raises(ValueError):
            RateLimiter(burst_size=0)

