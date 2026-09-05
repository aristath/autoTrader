"""Tests for Currency and CurrencyExchangeService.

These tests verify:
1. Currency.get_cross_rate() - cross-currency conversion logic
2. CurrencyExchangeService.get_rate() - rate retrieval with error handling
"""

import json
from unittest.mock import AsyncMock, patch

import pytest

from sentinel.currency import Currency
from sentinel.currency_exchange import CurrencyExchangeService
from sentinel.database import Database


@pytest.fixture(autouse=True)
def clear_singletons():
    """Clear singleton instances before each test."""
    # Clear Currency singleton
    if hasattr(Currency, "_clear"):
        Currency._clear()  # type: ignore
    # Clear CurrencyExchangeService singleton
    if hasattr(CurrencyExchangeService, "_clear"):
        CurrencyExchangeService._clear()  # type: ignore
    yield
    # Clear again after test
    if hasattr(Currency, "_clear"):
        Currency._clear()  # type: ignore
    if hasattr(CurrencyExchangeService, "_clear"):
        CurrencyExchangeService._clear()  # type: ignore


@pytest.fixture
def currency_with_rates():
    """Create a Currency instance with mock rates."""
    currency = Currency()
    # Set up test rates (currency -> EUR conversion rates)
    currency._rates_cache = {
        "EUR": 1.0,
        "USD": 0.85,  # 1 USD = 0.85 EUR
        "GBP": 1.17,  # 1 GBP = 1.17 EUR
        "HKD": 0.11,  # 1 HKD = 0.11 EUR
    }
    return currency


@pytest.fixture
def exchange_service_with_rates():
    """Create a CurrencyExchangeService with mocked currency rates."""
    service = CurrencyExchangeService()
    service._currency._rates_cache = {
        "EUR": 1.0,
        "USD": 0.85,  # 1 USD = 0.85 EUR
        "GBP": 1.17,  # 1 GBP = 1.17 EUR
        "HKD": 0.11,  # 1 HKD = 0.11 EUR
    }
    return service


class TestCurrencyGetCrossRate:
    """Tests for Currency.get_cross_rate() method."""

    @pytest.mark.asyncio
    async def test_same_currency_returns_one(self, currency_with_rates):
        """Same currency conversion should return 1.0."""
        rate = await currency_with_rates.get_cross_rate("USD", "USD")
        assert rate == 1.0

        rate = await currency_with_rates.get_cross_rate("EUR", "EUR")
        assert rate == 1.0

    @pytest.mark.asyncio
    async def test_eur_base_conversion_to_usd(self, currency_with_rates):
        """EUR to USD conversion (EUR is base)."""
        # 1 EUR = 1.0 EUR (identity)
        # 1 USD = 0.85 EUR
        # Therefore: 1 EUR = 1.0/0.85 USD ≈ 1.176 USD
        rate = await currency_with_rates.get_cross_rate("EUR", "USD")
        expected = 1.0 / 0.85
        assert abs(rate - expected) < 0.001

    @pytest.mark.asyncio
    async def test_eur_base_conversion_to_gbp(self, currency_with_rates):
        """EUR to GBP conversion (EUR is base)."""
        # 1 EUR = 1.0 EUR (identity)
        # 1 GBP = 1.17 EUR
        # Therefore: 1 EUR = 1.0/1.17 GBP ≈ 0.855 GBP
        rate = await currency_with_rates.get_cross_rate("EUR", "GBP")
        expected = 1.0 / 1.17
        assert abs(rate - expected) < 0.001

    @pytest.mark.asyncio
    async def test_eur_base_conversion_to_hkd(self, currency_with_rates):
        """EUR to HKD conversion (EUR is base)."""
        # 1 EUR = 1.0 EUR (identity)
        # 1 HKD = 0.11 EUR
        # Therefore: 1 EUR = 1.0/0.11 HKD ≈ 9.09 HKD
        rate = await currency_with_rates.get_cross_rate("EUR", "HKD")
        expected = 1.0 / 0.11
        assert abs(rate - expected) < 0.01

    @pytest.mark.asyncio
    async def test_non_eur_base_usd_to_gbp(self, currency_with_rates):
        """USD to GBP conversion (cross rate via EUR)."""
        # 1 USD = 0.85 EUR
        # 1 GBP = 1.17 EUR
        # Therefore: 1 USD = 0.85/1.17 GBP ≈ 0.726 GBP
        rate = await currency_with_rates.get_cross_rate("USD", "GBP")
        expected = 0.85 / 1.17
        assert abs(rate - expected) < 0.001

    @pytest.mark.asyncio
    async def test_non_eur_base_gbp_to_usd(self, currency_with_rates):
        """GBP to USD conversion (cross rate via EUR)."""
        # 1 GBP = 1.17 EUR
        # 1 USD = 0.85 EUR
        # Therefore: 1 GBP = 1.17/0.85 USD ≈ 1.376 USD
        rate = await currency_with_rates.get_cross_rate("GBP", "USD")
        expected = 1.17 / 0.85
        assert abs(rate - expected) < 0.001

    @pytest.mark.asyncio
    async def test_non_eur_base_gbp_to_hkd(self, currency_with_rates):
        """GBP to HKD conversion (cross rate via EUR)."""
        # 1 GBP = 1.17 EUR
        # 1 HKD = 0.11 EUR
        # Therefore: 1 GBP = 1.17/0.11 HKD ≈ 10.64 HKD
        rate = await currency_with_rates.get_cross_rate("GBP", "HKD")
        expected = 1.17 / 0.11
        assert abs(rate - expected) < 0.01

    @pytest.mark.asyncio
    async def test_non_eur_base_usd_to_hkd(self, currency_with_rates):
        """USD to HKD conversion (cross rate via EUR)."""
        # 1 USD = 0.85 EUR
        # 1 HKD = 0.11 EUR
        # Therefore: 1 USD = 0.85/0.11 HKD ≈ 7.73 HKD
        rate = await currency_with_rates.get_cross_rate("USD", "HKD")
        expected = 0.85 / 0.11
        assert abs(rate - expected) < 0.01

    @pytest.mark.asyncio
    async def test_missing_from_currency_raises_error(self, currency_with_rates):
        """Missing from_currency should raise ValueError."""
        with pytest.raises(ValueError, match="No rate available"):
            await currency_with_rates.get_cross_rate("JPY", "USD")

    @pytest.mark.asyncio
    async def test_missing_to_currency_raises_error(self, currency_with_rates):
        """Missing to_currency should raise ValueError."""
        with pytest.raises(ValueError, match="No rate available"):
            await currency_with_rates.get_cross_rate("USD", "JPY")

    @pytest.mark.asyncio
    async def test_both_currencies_missing_raises_error(self, currency_with_rates):
        """Both currencies missing should raise ValueError."""
        with pytest.raises(ValueError, match="No rate available"):
            await currency_with_rates.get_cross_rate("JPY", "CAD")

    @pytest.mark.asyncio
    async def test_case_insensitive_currency_codes(self, currency_with_rates):
        """Currency codes should be case-insensitive."""
        rate_upper = await currency_with_rates.get_cross_rate("USD", "GBP")
        rate_lower = await currency_with_rates.get_cross_rate("usd", "gbp")
        rate_mixed = await currency_with_rates.get_cross_rate("Usd", "Gbp")

        assert abs(rate_upper - rate_lower) < 0.0001
        assert abs(rate_upper - rate_mixed) < 0.0001


class TestCurrencyUpdates:
    @pytest.mark.asyncio
    @pytest.mark.parametrize("currency", ["", "US", "USDD", "U1D", "ΕUR"])
    async def test_set_rate_rejects_invalid_currency_code(self, currency_with_rates, currency):
        currency_with_rates._settings = AsyncMock()
        currency_with_rates._db = AsyncMock()

        with pytest.raises(ValueError, match="three-letter"):
            await currency_with_rates.set_rate(currency, 0.9)

    @pytest.mark.asyncio
    async def test_set_rate_preserves_eur_as_the_unit_rate(self, currency_with_rates):
        currency_with_rates._settings = AsyncMock()
        currency_with_rates._db = AsyncMock()

        with pytest.raises(ValueError, match="EUR rate must be 1.0"):
            await currency_with_rates.set_rate("EUR", 0.9)

    @pytest.mark.asyncio
    @pytest.mark.parametrize("rate", [0, -0.1, float("nan"), float("inf")])
    async def test_set_rate_rejects_non_positive_or_non_finite_values(self, currency_with_rates, rate):
        currency_with_rates._settings = AsyncMock()
        currency_with_rates._db = AsyncMock()

        with pytest.raises(ValueError, match="positive finite"):
            await currency_with_rates.set_rate("USD", rate)

        currency_with_rates._db.set_setting_and_cache.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_set_rate_updates_settings_and_persisted_cache(self, currency_with_rates):
        currency_with_rates._settings = AsyncMock()
        currency_with_rates._db = AsyncMock()

        await currency_with_rates.set_rate(" usd ", 0.9)

        expected = {"EUR": 1.0, "USD": 0.9, "GBP": 1.17, "HKD": 0.11}
        currency_with_rates._db.set_setting_and_cache.assert_awaited_once_with(
            "exchange_rates",
            expected,
            "currency:rates",
            json.dumps(expected),
            ttl_seconds=7200,
        )
        assert currency_with_rates._rates_cache == expected

    @pytest.mark.asyncio
    async def test_set_rate_keeps_runtime_value_when_atomic_persistence_fails(self, currency_with_rates):
        currency_with_rates._db = AsyncMock()
        currency_with_rates._db.set_setting_and_cache.side_effect = RuntimeError("database write failed")

        with pytest.raises(RuntimeError, match="database write failed"):
            await currency_with_rates.set_rate("USD", 0.9)

        assert await currency_with_rates.get_rates() == {
            "EUR": 1.0,
            "USD": 0.85,
            "GBP": 1.17,
            "HKD": 0.11,
        }

    @pytest.mark.asyncio
    async def test_set_rate_survives_an_in_memory_cache_reset(self, currency_with_rates, tmp_path):
        db = Database(str(tmp_path / "currency.db"))
        await db.connect()
        try:
            await db.cache_set(
                "currency:rates",
                json.dumps({"EUR": 1.0, "USD": 0.8}),
                ttl_seconds=7200,
            )
            currency_with_rates._db = db
            currency_with_rates._settings = AsyncMock()

            await currency_with_rates.set_rate("USD", 0.9)
            currency_with_rates._rates_cache = None

            assert await currency_with_rates.get_rates() == {
                "EUR": 1.0,
                "USD": 0.9,
                "GBP": 1.17,
                "HKD": 0.11,
            }
        finally:
            await db.close()
            db.remove_from_cache()

    @pytest.mark.asyncio
    async def test_strict_sync_propagates_network_failure(self, currency_with_rates):
        currency_with_rates._settings = AsyncMock()
        currency_with_rates._db = AsyncMock()

        with (
            patch("sentinel.currency.requests.get", side_effect=RuntimeError("gateway unavailable")),
            pytest.raises(RuntimeError, match="gateway unavailable"),
        ):
            await currency_with_rates.sync_rates(raise_on_error=True)


class TestCurrencyExchangeServiceGetRate:
    """Tests for CurrencyExchangeService.get_rate() method."""

    @pytest.mark.asyncio
    async def test_successful_rate_retrieval(self, exchange_service_with_rates):
        """get_rate should return rate from Currency.get_cross_rate."""
        rate = await exchange_service_with_rates.get_rate("USD", "GBP")
        assert rate is not None
        expected = 0.85 / 1.17
        assert abs(rate - expected) < 0.001

    @pytest.mark.asyncio
    async def test_same_currency_returns_one(self, exchange_service_with_rates):
        """get_rate for same currency should return 1.0."""
        rate = await exchange_service_with_rates.get_rate("EUR", "EUR")
        assert rate == 1.0

    @pytest.mark.asyncio
    async def test_missing_currency_returns_none(self, exchange_service_with_rates):
        """get_rate should return None for missing currencies."""
        rate = await exchange_service_with_rates.get_rate("USD", "JPY")
        assert rate is None

    @pytest.mark.asyncio
    async def test_error_handling_returns_none(self):
        """get_rate should return None and log error on exception."""
        # Create a fresh service instance
        service = CurrencyExchangeService()

        # Mock get_cross_rate to raise an exception
        async def mock_get_cross_rate(from_currency, to_currency):
            raise Exception("Database error")

        service._currency.get_cross_rate = mock_get_cross_rate

        rate = await service.get_rate("USD", "GBP")
        assert rate is None

    @pytest.mark.asyncio
    async def test_eur_conversions(self):
        """Test various EUR-based conversions."""
        service = CurrencyExchangeService()
        service._currency._rates_cache = {
            "EUR": 1.0,
            "USD": 0.85,
            "GBP": 1.17,
            "HKD": 0.11,
        }

        # EUR to USD
        rate = await service.get_rate("EUR", "USD")
        assert rate is not None
        assert abs(rate - 1.0 / 0.85) < 0.001

        # USD to EUR
        rate = await service.get_rate("USD", "EUR")
        assert rate is not None
        assert abs(rate - 0.85) < 0.001

    @pytest.mark.asyncio
    async def test_cross_rate_consistency(self):
        """Test that cross rates are consistent (A->B * B->A ≈ 1)."""
        service = CurrencyExchangeService()
        service._currency._rates_cache = {
            "EUR": 1.0,
            "USD": 0.85,
            "GBP": 1.17,
            "HKD": 0.11,
        }

        rate_forward = await service.get_rate("USD", "GBP")
        rate_backward = await service.get_rate("GBP", "USD")

        assert rate_forward is not None
        assert rate_backward is not None
        # Forward * Backward should be approximately 1.0
        assert abs(rate_forward * rate_backward - 1.0) < 0.001

    @pytest.mark.asyncio
    async def test_triangular_consistency(self):
        """Test triangular arbitrage consistency (USD->GBP->HKD = USD->HKD)."""
        service = CurrencyExchangeService()
        service._currency._rates_cache = {
            "EUR": 1.0,
            "USD": 0.85,
            "GBP": 1.17,
            "HKD": 0.11,
        }

        # Direct: USD -> HKD
        rate_direct = await service.get_rate("USD", "HKD")

        # Indirect: USD -> GBP -> HKD
        rate_usd_gbp = await service.get_rate("USD", "GBP")
        rate_gbp_hkd = await service.get_rate("GBP", "HKD")

        # Ensure intermediate rates are available before multiplication
        assert rate_direct is not None
        assert rate_usd_gbp is not None
        assert rate_gbp_hkd is not None

        rate_indirect = rate_usd_gbp * rate_gbp_hkd
        # Should be approximately equal
        assert abs(rate_direct - rate_indirect) < 0.01
