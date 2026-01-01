"""Service locator for finding and connecting to services."""

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

import grpc
import yaml  # type: ignore[import-untyped]

from app.infrastructure.service_discovery.device_config import DeviceInfo


@dataclass
class ServiceConfig:
    """Service configuration."""

    name: str
    mode: str  # "local" or "remote"
    device_id: str
    port: int
    client_config: Dict[str, Any]
    health_check_config: Dict[str, Any]


@dataclass
class ServiceLocation:
    """Service location information."""

    name: str
    mode: str  # "local" or "remote"
    address: str  # "localhost" or IP address
    port: int
    timeout_seconds: int
    max_retries: int
    retry_backoff_ms: int


class ServiceLocator:
    """
    Locates services and provides connection information.

    Handles both local (in-process) and remote (gRPC) services.
    """

    def __init__(self, services_config_path: Optional[str] = None):
        """
        Initialize service locator.

        Args:
            services_config_path: Path to services.yaml, or None for default
        """
        services_config_path_resolved: str
        if services_config_path is None:
            app_root = Path(__file__).parent.parent.parent
            services_config_path_resolved = str(app_root / "config" / "services.yaml")
        else:
            services_config_path_resolved = services_config_path

        # Allow override via environment variable
        services_config_path_resolved = os.getenv(
            "SERVICES_CONFIG_PATH", services_config_path_resolved
        )

        with open(services_config_path_resolved, "r") as f:
            self.config = yaml.safe_load(f)

        self.deployment_mode = self.config["deployment"]["mode"]
        self.services = self.config["services"]
        self.devices = {
            dev_id: DeviceInfo(id=dev_id, address=info["address"])
            for dev_id, info in self.config["devices"].items()
        }

    def get_service_location(self, service_name: str) -> ServiceLocation:
        """
        Get location info for a service.

        Args:
            service_name: Name of service (e.g., "planning")

        Returns:
            ServiceLocation with connection details

        Raises:
            ValueError: If service not found in config
        """
        if service_name not in self.services:
            raise ValueError(f"Service '{service_name}' not found in config")

        svc = self.services[service_name]
        mode = svc["mode"]
        device_id = svc["device_id"]
        port = svc["port"]

        # Get device address
        if mode == "local":
            address = "localhost"
        else:
            if device_id not in self.devices:
                raise ValueError(
                    f"Device '{device_id}' not found for service '{service_name}'"
                )
            address = self.devices[device_id].address

        # Get client config
        client_config = svc.get("client", {})

        return ServiceLocation(
            name=service_name,
            mode=mode,
            address=address,
            port=port,
            timeout_seconds=client_config.get("timeout_seconds", 30),
            max_retries=client_config.get("max_retries", 3),
            retry_backoff_ms=client_config.get("retry_backoff_ms", 1000),
        )

    def create_channel(self, service_name: str) -> grpc.aio.Channel:
        """
        Create gRPC channel for a service.

        Args:
            service_name: Name of service

        Returns:
            Async gRPC channel
        """
        location = self.get_service_location(service_name)

        target = f"{location.address}:{location.port}"

        # Create channel options
        options = [
            ("grpc.keepalive_time_ms", 30000),
            ("grpc.keepalive_timeout_ms", 10000),
            ("grpc.keepalive_permit_without_calls", 1),
            ("grpc.http2.max_pings_without_data", 0),
        ]

        # Create insecure channel (for now)
        # TODO: Add TLS support for production
        channel = grpc.aio.insecure_channel(target, options=options)

        return channel

    def is_service_local(self, service_name: str) -> bool:
        """Check if service runs locally (in-process)."""
        location = self.get_service_location(service_name)
        return location.mode == "local"

    def get_all_local_services(self) -> list[str]:
        """Get list of services that run locally on this device."""
        return [name for name, svc in self.services.items() if svc["mode"] == "local"]


# Global service locator instance
_service_locator: Optional[ServiceLocator] = None


def get_service_locator() -> ServiceLocator:
    """Get global service locator instance (singleton)."""
    global _service_locator
    if _service_locator is None:
        _service_locator = ServiceLocator()
    return _service_locator


def reset_service_locator():
    """Reset service locator (for testing)."""
    global _service_locator
    _service_locator = None
