"""Device configuration management."""

import os
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

import yaml  # type: ignore[import-untyped]


@dataclass
class DeviceConfig:
    """Device configuration."""

    id: str
    name: str
    roles: List[str]
    bind_address: str
    advertise_address: str
    max_workers: int
    max_memory_mb: int


@dataclass
class DeviceInfo:
    """Device network information."""

    id: str
    address: str


def load_device_config(config_path: Optional[str] = None) -> DeviceConfig:
    """
    Load device configuration.

    Args:
        config_path: Path to device.yaml, or None to use default

    Returns:
        DeviceConfig object
    """
    config_path_resolved: str
    if config_path is None:
        # Default to app/config/device.yaml
        app_root = Path(__file__).parent.parent.parent
        config_path_resolved = str(app_root / "config" / "device.yaml")
    else:
        config_path_resolved = config_path

    # Allow override via environment variable
    config_path_resolved = os.getenv("DEVICE_CONFIG_PATH", config_path_resolved)

    with open(config_path_resolved, "r") as f:
        config = yaml.safe_load(f)

    device = config["device"]

    return DeviceConfig(
        id=device["id"],
        name=device["name"],
        roles=device["roles"],
        bind_address=device["network"]["bind_address"],
        advertise_address=device["network"]["advertise_address"],
        max_workers=device["resources"]["max_workers"],
        max_memory_mb=device["resources"]["max_memory_mb"],
    )


def get_device_id() -> str:
    """Get current device ID."""
    config = load_device_config()
    return config.id


def should_run_service(service_name: str) -> bool:
    """
    Check if this device should run the given service.

    Args:
        service_name: Name of service (e.g., "planning", "scoring")

    Returns:
        True if this device should run the service
    """
    config = load_device_config()

    # If role is "all", run everything
    if "all" in config.roles:
        return True

    # Check if service name is in roles
    return service_name in config.roles
