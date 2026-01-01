"""Tests for Settings value object."""

import pytest

from app.domain.value_objects.settings import Settings


class TestSettings:
    """Test Settings value object."""

    def test_create_default_settings(self):
        """Test creating settings with default values."""
        settings = Settings()

        assert settings.target_annual_return == 0.11
        assert settings.min_security_score == 0.5
        assert settings.optimizer_blend == 0.5
        assert settings.optimizer_target_return == 0.11
        assert settings.min_cash_reserve == 500.0

    def test_create_custom_settings(self):
        """Test creating settings with custom values."""
        settings = Settings(
            target_annual_return=0.12,
            min_security_score=0.6,
            optimizer_blend=0.7,
            optimizer_target_return=0.12,
            min_cash_reserve=1000.0,
        )

        assert settings.target_annual_return == 0.12
        assert settings.min_security_score == 0.6
        assert settings.optimizer_blend == 0.7
        assert settings.optimizer_target_return == 0.12
        assert settings.min_cash_reserve == 1000.0

    def test_settings_validation_target_annual_return(self):
        """Test that target_annual_return must be positive."""
        with pytest.raises(ValueError, match="target_annual_return must be positive"):
            Settings(target_annual_return=-0.1)

        with pytest.raises(ValueError, match="target_annual_return must be positive"):
            Settings(target_annual_return=0.0)

    def test_settings_validation_min_security_score(self):
        """Test that min_security_score must be between 0 and 1."""
        with pytest.raises(
            ValueError, match="min_security_score must be between 0 and 1"
        ):
            Settings(min_security_score=-0.1)

        with pytest.raises(
            ValueError, match="min_security_score must be between 0 and 1"
        ):
            Settings(min_security_score=1.1)

    def test_settings_validation_optimizer_blend(self):
        """Test that optimizer_blend must be between 0 and 1."""
        with pytest.raises(ValueError, match="optimizer_blend must be between 0 and 1"):
            Settings(optimizer_blend=-0.1)

        with pytest.raises(ValueError, match="optimizer_blend must be between 0 and 1"):
            Settings(optimizer_blend=1.1)

    def test_settings_validation_optimizer_target_return(self):
        """Test that optimizer_target_return must be positive."""
        with pytest.raises(
            ValueError, match="optimizer_target_return must be positive"
        ):
            Settings(optimizer_target_return=-0.1)

        with pytest.raises(
            ValueError, match="optimizer_target_return must be positive"
        ):
            Settings(optimizer_target_return=0.0)

    def test_settings_validation_min_cash_reserve(self):
        """Test that min_cash_reserve must be non-negative."""
        with pytest.raises(ValueError, match="min_cash_reserve must be non-negative"):
            Settings(min_cash_reserve=-100.0)

    def test_settings_from_dict(self):
        """Test creating settings from dictionary."""
        data = {
            "target_annual_return": "0.12",
            "min_security_score": "0.6",
            "optimizer_blend": "0.7",
            "optimizer_target_return": "0.12",
            "min_cash_reserve": "1000.0",
        }

        settings = Settings.from_dict(data)

        assert settings.target_annual_return == 0.12
        assert settings.min_security_score == 0.6
        assert settings.optimizer_blend == 0.7
        assert settings.optimizer_target_return == 0.12
        assert settings.min_cash_reserve == 1000.0

    def test_settings_from_dict_with_missing_keys(self):
        """Test that from_dict uses defaults for missing keys."""
        data = {
            "target_annual_return": "0.12",
        }

        settings = Settings.from_dict(data)

        assert settings.target_annual_return == 0.12
        assert settings.min_security_score == 0.5  # Default
        assert settings.optimizer_blend == 0.5  # Default
        assert settings.min_cash_reserve == 500.0  # Default

    def test_settings_to_dict(self):
        """Test converting settings to dictionary."""
        settings = Settings(
            target_annual_return=0.12,
            optimizer_blend=0.7,
            min_cash_reserve=1000.0,
        )

        data = settings.to_dict()

        assert data["target_annual_return"] == 0.12
        assert data["optimizer_blend"] == 0.7
        assert data["min_security_score"] == 0.5  # Default
        assert data["optimizer_target_return"] == 0.11  # Default
        assert data["min_cash_reserve"] == 1000.0
