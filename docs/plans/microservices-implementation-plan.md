# Microservices Implementation Plan - Complete Guide

**Version:** 1.0
**Date:** 2026-01-01
**Status:** Draft - Ready for Implementation

---

## Executive Summary

This document provides a complete, step-by-step implementation plan for migrating the Arduino Trader application from a monolithic architecture to a 7-service microservices architecture using gRPC.

**Key Goals:**
- ✅ Proper separation of concerns (7 independent services)
- ✅ Independent deployability (reboot/replace individual services)
- ✅ Fault isolation (service failures don't cascade)
- ✅ Load balancing (distribute services across devices)
- ✅ Single codebase (same code on all devices, config-driven deployment)
- ✅ Progressive migration (start with all local, migrate incrementally)

**Architecture:**
- **3 Compute Services** (Device 1): Planning, Scoring, Optimization
- **4 State/Trading Services** (Device 2): Portfolio, Trading, Universe, Gateway
- **Communication:** gRPC (reliable, performant, streaming support)
- **Deployment:** Single codebase, device-specific configuration

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Contracts Package](#2-contracts-package)
3. [Service Implementation Pattern](#3-service-implementation-pattern)
4. [Configuration System](#4-configuration-system)
5. [Service Discovery](#5-service-discovery)
6. [Migration Steps](#6-migration-steps)
7. [Testing Strategy](#7-testing-strategy)
8. [Deployment Strategy](#8-deployment-strategy)
9. [Load Balancing](#9-load-balancing)
10. [Monitoring & Observability](#10-monitoring--observability)
11. [Rollback Strategy](#11-rollback-strategy)
12. [Performance Considerations](#12-performance-considerations)

---

## 1. Project Structure

### New Directory Layout

```
arduino-trader/
├── contracts/                          # Shared contracts package
│   ├── setup.py
│   ├── pyproject.toml
│   ├── README.md
│   ├── protos/                        # Protobuf definitions
│   │   ├── common/
│   │   │   ├── common.proto           # Shared types (Empty, Money, etc.)
│   │   │   ├── position.proto         # Position message
│   │   │   ├── security.proto         # Security message
│   │   │   └── money.proto            # Money, Currency
│   │   ├── planning.proto             # Planning service contract
│   │   ├── scoring.proto              # Scoring service contract
│   │   ├── optimization.proto         # Optimization service contract
│   │   ├── portfolio.proto            # Portfolio service contract
│   │   ├── trading.proto              # Trading service contract
│   │   ├── universe.proto             # Universe service contract
│   │   └── gateway.proto              # Gateway service contract
│   └── contracts/                     # Generated Python code
│       ├── __init__.py
│       ├── common_pb2.py              # Auto-generated
│       ├── common_pb2_grpc.py
│       ├── planning_pb2.py
│       ├── planning_pb2_grpc.py
│       └── ... (all generated files)
│
├── services/                          # gRPC service implementations
│   ├── planning/
│   │   ├── main.py                   # Service entrypoint
│   │   ├── server.py                 # gRPC servicer implementation
│   │   ├── config.yaml               # Service-specific config
│   │   ├── requirements.txt          # Dependencies
│   │   └── Dockerfile                # Container image
│   ├── scoring/
│   │   ├── main.py
│   │   ├── server.py
│   │   ├── config.yaml
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── optimization/
│   │   ├── main.py
│   │   ├── server.py
│   │   ├── config.yaml
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── portfolio/
│   │   ├── main.py
│   │   ├── server.py
│   │   ├── config.yaml
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── trading/
│   │   ├── main.py
│   │   ├── server.py
│   │   ├── config.yaml
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── universe/
│   │   ├── main.py
│   │   ├── server.py
│   │   ├── config.yaml
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── gateway/
│       ├── main.py
│       ├── server.py
│       ├── config.yaml
│       ├── requirements.txt
│       └── Dockerfile
│
├── app/                               # Refactored application
│   ├── modules/
│   │   ├── planning/
│   │   │   ├── domain/               # Domain logic (unchanged)
│   │   │   ├── database/             # Repositories (unchanged)
│   │   │   └── services/
│   │   │       ├── planning_service_interface.py   # Protocol definition
│   │   │       ├── local_planning_service.py       # In-process impl
│   │   │       └── grpc_planning_client.py         # gRPC client impl
│   │   ├── scoring/
│   │   │   ├── domain/
│   │   │   ├── database/
│   │   │   └── services/
│   │   │       ├── scoring_service_interface.py
│   │   │       ├── local_scoring_service.py
│   │   │       └── grpc_scoring_client.py
│   │   ├── optimization/
│   │   │   ├── domain/
│   │   │   ├── database/
│   │   │   └── services/
│   │   │       ├── optimization_service_interface.py
│   │   │       ├── local_optimization_service.py
│   │   │       └── grpc_optimization_client.py
│   │   ├── portfolio/
│   │   │   ├── domain/
│   │   │   ├── database/
│   │   │   └── services/
│   │   │       ├── portfolio_service_interface.py
│   │   │       ├── local_portfolio_service.py
│   │   │       └── grpc_portfolio_client.py
│   │   ├── trading/
│   │   │   ├── domain/
│   │   │   ├── database/
│   │   │   └── services/
│   │   │       ├── trading_service_interface.py
│   │   │       ├── local_trading_service.py
│   │   │       └── grpc_trading_client.py
│   │   ├── universe/
│   │   │   ├── domain/
│   │   │   ├── database/
│   │   │   └── services/
│   │   │       ├── universe_service_interface.py
│   │   │       ├── local_universe_service.py
│   │   │       └── grpc_universe_client.py
│   │   └── gateway/
│   │       └── services/
│   │           ├── gateway_service_interface.py
│   │           ├── local_gateway_service.py
│   │           └── grpc_gateway_client.py
│   │
│   ├── infrastructure/
│   │   ├── service_discovery/        # NEW: Service location/discovery
│   │   │   ├── __init__.py
│   │   │   ├── service_locator.py    # Service locator pattern
│   │   │   ├── device_config.py      # Device configuration
│   │   │   └── health_checker.py     # Health check utilities
│   │   ├── grpc_helpers/             # NEW: gRPC utilities
│   │   │   ├── __init__.py
│   │   │   ├── interceptors.py       # Logging, metrics interceptors
│   │   │   ├── retry.py              # Retry logic
│   │   │   └── converters.py         # Proto ↔ Domain conversions
│   │   └── dependencies.py           # MODIFIED: Returns service impls
│   │
│   ├── config/
│   │   ├── device.yaml               # NEW: Device-specific config
│   │   ├── services.yaml             # NEW: Service discovery config
│   │   └── deployment.yaml           # NEW: Deployment topology
│   │
│   └── jobs/
│       └── ... (existing jobs, updated to use service interfaces)
│
├── deploy/
│   ├── configs/                      # Deployment configurations
│   │   ├── single-device/
│   │   │   ├── device.yaml           # All services on one device
│   │   │   └── services.yaml
│   │   ├── dual-device/
│   │   │   ├── device1.yaml          # Compute services
│   │   │   ├── device2.yaml          # State/Trading services
│   │   │   └── services.yaml
│   │   └── load-balanced/
│   │       ├── device1.yaml          # Custom distribution
│   │       ├── device2.yaml
│   │       └── services.yaml
│   ├── docker/
│   │   ├── docker-compose.single.yml  # Single device deployment
│   │   ├── docker-compose.dual.yml    # Dual device deployment
│   │   └── docker-compose.lb.yml      # Load balanced deployment
│   └── systemd/
│       ├── arduino-trader.service     # Main app service
│       ├── arduino-trader-planning.service
│       ├── arduino-trader-scoring.service
│       └── ... (one per service)
│
├── scripts/
│   ├── generate_protos.sh            # Generate Python from .proto files
│   ├── start_all_services.sh         # Start all services locally
│   ├── start_services_for_device.sh  # Start services for specific device
│   ├── health_check.sh               # Check all services health
│   └── deploy_to_device.sh           # Deploy to specific device
│
├── tests/
│   ├── contracts/                    # Contract validation tests
│   │   └── test_proto_contracts.py
│   ├── integration/
│   │   └── services/                 # Service integration tests
│   │       ├── test_planning_service.py
│   │       ├── test_scoring_service.py
│   │       ├── test_optimization_service.py
│   │       ├── test_portfolio_service.py
│   │       ├── test_trading_service.py
│   │       ├── test_universe_service.py
│   │       └── test_gateway_service.py
│   └── e2e/
│       ├── test_full_trading_workflow.py
│       ├── test_cross_device_communication.py
│       └── test_failure_scenarios.py
│
└── docs/
    └── plans/
        └── microservices-implementation-plan.md  # This document
```

---

## 2. Contracts Package

[Previous protobuf definitions from earlier - all 7 service contracts]

The contracts package contains all protobuf definitions. This is a separate Python package that both the main app and gRPC services depend on.

### contracts/setup.py

```python
from setuptools import setup, find_packages

setup(
    name="arduino-trader-contracts",
    version="1.0.0",
    description="gRPC contracts for Arduino Trader microservices",
    packages=find_packages(),
    install_requires=[
        "grpcio>=1.60.0",
        "grpcio-tools>=1.60.0",
        "protobuf>=4.25.0",
    ],
    python_requires=">=3.10",
)
```

### contracts/pyproject.toml

```toml
[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "arduino-trader-contracts"
version = "1.0.0"
description = "gRPC contracts for Arduino Trader microservices"
requires-python = ">=3.10"
dependencies = [
    "grpcio>=1.60.0",
    "grpcio-tools>=1.60.0",
    "protobuf>=4.25.0",
]
```

### scripts/generate_protos.sh

```bash
#!/bin/bash
# Generate Python code from protobuf definitions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"
PROTOS_DIR="$CONTRACTS_DIR/protos"
OUTPUT_DIR="$CONTRACTS_DIR/contracts"

echo "Generating Python code from protobuf definitions..."

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate Python code
python -m grpc_tools.protoc \
    --proto_path="$PROTOS_DIR" \
    --python_out="$OUTPUT_DIR" \
    --grpc_python_out="$OUTPUT_DIR" \
    "$PROTOS_DIR/common/common.proto" \
    "$PROTOS_DIR/common/position.proto" \
    "$PROTOS_DIR/common/security.proto" \
    "$PROTOS_DIR/planning.proto" \
    "$PROTOS_DIR/scoring.proto" \
    "$PROTOS_DIR/optimization.proto" \
    "$PROTOS_DIR/portfolio.proto" \
    "$PROTOS_DIR/trading.proto" \
    "$PROTOS_DIR/universe.proto" \
    "$PROTOS_DIR/gateway.proto"

# Create __init__.py
cat > "$OUTPUT_DIR/__init__.py" << 'EOF'
"""
Arduino Trader gRPC Contracts.

Auto-generated from protobuf definitions.
Do not edit manually - run scripts/generate_protos.sh to regenerate.
"""

from contracts import (
    common_pb2,
    common_pb2_grpc,
    position_pb2,
    position_pb2_grpc,
    security_pb2,
    security_pb2_grpc,
    planning_pb2,
    planning_pb2_grpc,
    scoring_pb2,
    scoring_pb2_grpc,
    optimization_pb2,
    optimization_pb2_grpc,
    portfolio_pb2,
    portfolio_pb2_grpc,
    trading_pb2,
    trading_pb2_grpc,
    universe_pb2,
    universe_pb2_grpc,
    gateway_pb2,
    gateway_pb2_grpc,
)

__all__ = [
    'common_pb2',
    'common_pb2_grpc',
    'planning_pb2',
    'planning_pb2_grpc',
    'scoring_pb2',
    'scoring_pb2_grpc',
    'optimization_pb2',
    'optimization_pb2_grpc',
    'portfolio_pb2',
    'portfolio_pb2_grpc',
    'trading_pb2',
    'trading_pb2_grpc',
    'universe_pb2',
    'universe_pb2_grpc',
    'gateway_pb2',
    'gateway_pb2_grpc',
]
EOF

echo "✓ Protobuf code generation complete!"
echo "  Output: $OUTPUT_DIR"

# Install contracts package in development mode
echo "Installing contracts package..."
cd "$CONTRACTS_DIR"
pip install -e .

echo "✓ All done!"
```

---

## 3. Service Implementation Pattern

[Previous service implementation pattern from earlier]

Each service follows this pattern:
1. **Interface** (Protocol) - Defines the contract
2. **Local Implementation** - In-process, wraps existing domain logic
3. **gRPC Client** - Calls remote service via gRPC
4. **gRPC Server** - Serves requests via gRPC

---

## 4. Configuration System

### Device-Specific Configuration

Each device has a **unique device ID** and knows which services to run.

#### app/config/device.yaml

```yaml
# Device Configuration
# This file identifies the device and determines which services run

device:
  # Unique device identifier
  # Options: "primary", "compute-1", "device-1", "device-2", etc.
  id: "primary"

  # Human-readable name
  name: "Arduino Uno Q - Main Device"

  # Device role(s)
  # Can be: "all", "compute", "state", "gateway", or specific services
  roles:
    - "all"  # Run all services locally

  # Network configuration
  network:
    # This device's IP address (for service binding)
    bind_address: "0.0.0.0"

    # Advertised address (for other devices to reach this one)
    advertise_address: "192.168.1.11"

  # Resource limits
  resources:
    max_workers: 10        # gRPC server thread pool size
    max_memory_mb: 2048    # Memory limit hint
```

#### app/config/services.yaml

```yaml
# Service Discovery Configuration
# Maps services to devices and ports

deployment:
  # Deployment mode: "local", "distributed", "load_balanced"
  mode: "local"

services:
  planning:
    # Service mode: "local" (in-process) or "remote" (gRPC)
    mode: "local"

    # Device assignment (used when mode: remote)
    device_id: "primary"

    # Network configuration
    port: 50051

    # gRPC client configuration (used when mode: remote)
    client:
      timeout_seconds: 300
      max_retries: 3
      retry_backoff_ms: 1000
      keepalive_interval_seconds: 30
      keepalive_timeout_seconds: 10

    # Health check configuration
    health_check:
      enabled: true
      interval_seconds: 30
      timeout_seconds: 5

  scoring:
    mode: "local"
    device_id: "primary"
    port: 50052
    client:
      timeout_seconds: 60
      max_retries: 3
      retry_backoff_ms: 1000
    health_check:
      enabled: true
      interval_seconds: 30

  optimization:
    mode: "local"
    device_id: "primary"
    port: 50053
    client:
      timeout_seconds: 120
      max_retries: 2
    health_check:
      enabled: true
      interval_seconds: 60

  portfolio:
    mode: "local"
    device_id: "primary"
    port: 50054
    client:
      timeout_seconds: 30
      max_retries: 5
      # Portfolio is critical - aggressive retries
    health_check:
      enabled: true
      interval_seconds: 15

  trading:
    mode: "local"
    device_id: "primary"
    port: 50055
    client:
      timeout_seconds: 60
      max_retries: 3
    health_check:
      enabled: true
      interval_seconds: 30

  universe:
    mode: "local"
    device_id: "primary"
    port: 50056
    client:
      timeout_seconds: 120
      max_retries: 3
    health_check:
      enabled: true
      interval_seconds: 60

  gateway:
    mode: "local"
    device_id: "primary"
    port: 50057
    http_port: 8000  # REST API for web UI
    client:
      timeout_seconds: 30
      max_retries: 3
    health_check:
      enabled: true
      interval_seconds: 15

# Device registry - maps device IDs to network addresses
devices:
  primary:
    address: "localhost"
    # When running distributed, change to actual IP
    # address: "192.168.1.11"

  compute-1:
    address: "192.168.1.10"

  # Add more devices as needed
```

#### deploy/configs/dual-device/device1.yaml

```yaml
# Device 1: Compute Engine
device:
  id: "compute-1"
  name: "Arduino Uno Q - Compute Engine"
  roles:
    - "planning"
    - "scoring"
    - "optimization"
  network:
    bind_address: "0.0.0.0"
    advertise_address: "192.168.1.10"
  resources:
    max_workers: 10
    max_memory_mb: 2048
```

#### deploy/configs/dual-device/device2.yaml

```yaml
# Device 2: Portfolio Manager
device:
  id: "primary"
  name: "Arduino Uno Q - Portfolio Manager"
  roles:
    - "portfolio"
    - "trading"
    - "universe"
    - "gateway"
  network:
    bind_address: "0.0.0.0"
    advertise_address: "192.168.1.11"
  resources:
    max_workers: 10
    max_memory_mb: 2048
```

#### deploy/configs/dual-device/services.yaml

```yaml
# Dual-device deployment configuration

deployment:
  mode: "distributed"

services:
  planning:
    mode: "remote"        # Call via gRPC
    device_id: "compute-1"
    port: 50051
    client:
      timeout_seconds: 300
      max_retries: 3
      retry_backoff_ms: 1000

  scoring:
    mode: "remote"
    device_id: "compute-1"
    port: 50052
    client:
      timeout_seconds: 60
      max_retries: 3

  optimization:
    mode: "remote"
    device_id: "compute-1"
    port: 50053
    client:
      timeout_seconds: 120
      max_retries: 2

  portfolio:
    mode: "local"         # Local on device 2
    device_id: "primary"
    port: 50054
    # Still expose gRPC for monitoring
    client:
      timeout_seconds: 30
      max_retries: 5

  trading:
    mode: "local"
    device_id: "primary"
    port: 50055

  universe:
    mode: "local"
    device_id: "primary"
    port: 50056

  gateway:
    mode: "local"
    device_id: "primary"
    port: 50057
    http_port: 8000

devices:
  compute-1:
    address: "192.168.1.10"
  primary:
    address: "192.168.1.11"
```

#### deploy/configs/load-balanced/services.yaml

```yaml
# Load-balanced deployment
# Distributes services across 2 devices for balanced CPU/memory usage

deployment:
  mode: "load_balanced"

services:
  # Heavy compute on Device 1
  planning:
    mode: "remote"
    device_id: "compute-1"
    port: 50051

  scoring:
    mode: "remote"
    device_id: "compute-1"
    port: 50052

  # Light compute on Device 1
  analytics:
    mode: "remote"
    device_id: "compute-1"
    port: 50053

  # State management on Device 2
  portfolio:
    mode: "remote"
    device_id: "primary"
    port: 50054

  # I/O intensive on Device 2
  universe:
    mode: "remote"
    device_id: "primary"
    port: 50056

  trading:
    mode: "remote"
    device_id: "primary"
    port: 50055

  # UI on Device 2
  gateway:
    mode: "local"  # Always local on the device user accesses
    device_id: "primary"
    port: 50057
    http_port: 8000

devices:
  compute-1:
    address: "192.168.1.10"
  primary:
    address: "192.168.1.11"
```

---

## 5. Service Discovery

### app/infrastructure/service_discovery/device_config.py

```python
"""Device configuration management."""
import os
import yaml
from dataclasses import dataclass
from typing import Optional, List
from pathlib import Path


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
    if config_path is None:
        # Default to app/config/device.yaml
        app_root = Path(__file__).parent.parent.parent
        config_path = app_root / "config" / "device.yaml"

    # Allow override via environment variable
    config_path = os.getenv("DEVICE_CONFIG_PATH", config_path)

    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    device = config['device']

    return DeviceConfig(
        id=device['id'],
        name=device['name'],
        roles=device['roles'],
        bind_address=device['network']['bind_address'],
        advertise_address=device['network']['advertise_address'],
        max_workers=device['resources']['max_workers'],
        max_memory_mb=device['resources']['max_memory_mb'],
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
```

### app/infrastructure/service_discovery/service_locator.py

```python
"""Service locator for finding and connecting to services."""
import os
import yaml
import grpc
from typing import Optional, Dict, Any
from pathlib import Path
from dataclasses import dataclass

from app.infrastructure.service_discovery.device_config import (
    load_device_config,
    DeviceInfo,
)


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
        if services_config_path is None:
            app_root = Path(__file__).parent.parent.parent
            services_config_path = app_root / "config" / "services.yaml"

        # Allow override via environment variable
        services_config_path = os.getenv(
            "SERVICES_CONFIG_PATH",
            services_config_path
        )

        with open(services_config_path, 'r') as f:
            self.config = yaml.safe_load(f)

        self.deployment_mode = self.config['deployment']['mode']
        self.services = self.config['services']
        self.devices = {
            dev_id: DeviceInfo(id=dev_id, address=info['address'])
            for dev_id, info in self.config['devices'].items()
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
        mode = svc['mode']
        device_id = svc['device_id']
        port = svc['port']

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
        client_config = svc.get('client', {})

        return ServiceLocation(
            name=service_name,
            mode=mode,
            address=address,
            port=port,
            timeout_seconds=client_config.get('timeout_seconds', 30),
            max_retries=client_config.get('max_retries', 3),
            retry_backoff_ms=client_config.get('retry_backoff_ms', 1000),
        )

    def create_channel(
        self,
        service_name: str
    ) -> grpc.aio.Channel:
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
            ('grpc.keepalive_time_ms', 30000),
            ('grpc.keepalive_timeout_ms', 10000),
            ('grpc.keepalive_permit_without_calls', 1),
            ('grpc.http2.max_pings_without_data', 0),
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
        return [
            name
            for name, svc in self.services.items()
            if svc['mode'] == 'local'
        ]


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
```

### app/infrastructure/dependencies.py (MODIFIED)

```python
"""
Dependency injection for services.

Returns appropriate service implementation based on configuration:
- Local services: In-process implementation
- Remote services: gRPC client implementation
"""
from typing import Union

from app.infrastructure.service_discovery.service_locator import get_service_locator

# Planning Service
from app.modules.planning.services.planning_service_interface import (
    PlanningServiceInterface
)
from app.modules.planning.services.local_planning_service import (
    LocalPlanningService
)
from app.modules.planning.services.grpc_planning_client import (
    GrpcPlanningClient
)

# Scoring Service
from app.modules.scoring.services.scoring_service_interface import (
    ScoringServiceInterface
)
from app.modules.scoring.services.local_scoring_service import (
    LocalScoringService
)
from app.modules.scoring.services.grpc_scoring_client import (
    GrpcScoringClient
)

# ... (similar imports for all 7 services)


def get_planning_service() -> PlanningServiceInterface:
    """
    Get planning service implementation.

    Returns local or remote implementation based on config.
    """
    locator = get_service_locator()

    if locator.is_service_local("planning"):
        # Return in-process implementation
        from app.modules.planning.database.planner_repository import (
            PlannerRepository
        )

        return LocalPlanningService(
            planner_repo=PlannerRepository(),
            scoring_service=get_scoring_service(),  # Can be local or remote
            optimization_service=get_optimization_service(),
        )
    else:
        # Return gRPC client
        channel = locator.create_channel("planning")
        return GrpcPlanningClient(channel)


def get_scoring_service() -> ScoringServiceInterface:
    """Get scoring service implementation."""
    locator = get_service_locator()

    if locator.is_service_local("scoring"):
        from app.modules.scoring.database.score_repository import (
            ScoreRepository
        )

        return LocalScoringService(
            score_repo=ScoreRepository(),
            # ... other dependencies
        )
    else:
        channel = locator.create_channel("scoring")
        return GrpcScoringClient(channel)


def get_optimization_service():
    """Get optimization service implementation."""
    locator = get_service_locator()

    if locator.is_service_local("optimization"):
        from app.modules.optimization.services.local_optimization_service import (
            LocalOptimizationService
        )
        return LocalOptimizationService()
    else:
        from app.modules.optimization.services.grpc_optimization_client import (
            GrpcOptimizationClient
        )
        channel = locator.create_channel("optimization")
        return GrpcOptimizationClient(channel)


def get_portfolio_service():
    """Get portfolio service implementation."""
    locator = get_service_locator()

    if locator.is_service_local("portfolio"):
        from app.modules.portfolio.services.local_portfolio_service import (
            LocalPortfolioService
        )
        return LocalPortfolioService()
    else:
        from app.modules.portfolio.services.grpc_portfolio_client import (
            GrpcPortfolioClient
        )
        channel = locator.create_channel("portfolio")
        return GrpcPortfolioClient(channel)


def get_trading_service():
    """Get trading service implementation."""
    locator = get_service_locator()

    if locator.is_service_local("trading"):
        from app.modules.trading.services.local_trading_service import (
            LocalTradingService
        )
        return LocalTradingService()
    else:
        from app.modules.trading.services.grpc_trading_client import (
            GrpcTradingClient
        )
        channel = locator.create_channel("trading")
        return GrpcTradingClient(channel)


def get_universe_service():
    """Get universe service implementation."""
    locator = get_service_locator()

    if locator.is_service_local("universe"):
        from app.modules.universe.services.local_universe_service import (
            LocalUniverseService
        )
        return LocalUniverseService()
    else:
        from app.modules.universe.services.grpc_universe_client import (
            GrpcUniverseClient
        )
        channel = locator.create_channel("universe")
        return GrpcUniverseClient(channel)


def get_gateway_service():
    """Get gateway service implementation."""
    locator = get_service_locator()

    if locator.is_service_local("gateway"):
        from app.modules.gateway.services.local_gateway_service import (
            LocalGatewayService
        )
        return LocalGatewayService()
    else:
        from app.modules.gateway.services.grpc_gateway_client import (
            GrpcGatewayClient
        )
        channel = locator.create_channel("gateway")
        return GrpcGatewayClient(channel)
```

---

## 6. Migration Steps

### Phase 1: Preparation (Week 1)

**Goal:** Set up infrastructure without changing existing code

**Tasks:**

1. **Create contracts package structure**
   ```bash
   mkdir -p contracts/protos/common
   mkdir -p contracts/contracts
   ```

2. **Write all protobuf definitions**
   - Copy protobuf definitions from this document
   - Place in `contracts/protos/`

3. **Generate Python code from protos**
   ```bash
   ./scripts/generate_protos.sh
   ```

4. **Install contracts package**
   ```bash
   cd contracts
   pip install -e .
   ```

5. **Create configuration files**
   - `app/config/device.yaml` - Set device_id: "primary", roles: ["all"]
   - `app/config/services.yaml` - All services mode: "local"

6. **Create service discovery infrastructure**
   - `app/infrastructure/service_discovery/device_config.py`
   - `app/infrastructure/service_discovery/service_locator.py`

**Success Criteria:**
- ✅ Contracts package builds successfully
- ✅ All `.proto` files compile to Python
- ✅ Configuration files load without errors
- ✅ Service locator can read config

**Testing:**
```bash
# Verify proto generation
ls contracts/contracts/*_pb2.py

# Verify contracts package installed
python -c "from contracts import planning_pb2; print('OK')"

# Verify config loading
python -c "from app.infrastructure.service_discovery import load_device_config; print(load_device_config().id)"
```

---

### Phase 2: Service Interfaces (Week 2-3)

**Goal:** Extract service interfaces and create local implementations

**For EACH of the 7 services, do the following:**

#### Planning Service Example

1. **Create interface**

   File: `app/modules/planning/services/planning_service_interface.py`

   ```python
   from typing import Protocol, AsyncIterator, Optional
   from dataclasses import dataclass

   @dataclass
   class PlanRequest:
       """Planning request data class."""
       portfolio_hash: str
       positions: list
       # ... all fields

   @dataclass
   class PlanUpdate:
       """Planning progress update."""
       # ... fields

   class PlanningServiceInterface(Protocol):
       """Planning service interface."""

       async def create_plan(
           self,
           request: PlanRequest
       ) -> AsyncIterator[PlanUpdate]:
           ...

       async def get_plan(
           self,
           portfolio_hash: str
       ) -> Optional['Plan']:
           ...

       # ... other methods
   ```

2. **Create local implementation**

   File: `app/modules/planning/services/local_planning_service.py`

   ```python
   class LocalPlanningService:
       """In-process planning service."""

       def __init__(self, planner_repo, scoring_service, optimization_service):
           self.planner_repo = planner_repo
           self.scoring_service = scoring_service
           self.optimization_service = optimization_service

       async def create_plan(self, request: PlanRequest):
           # Wrap existing create_holistic_plan_incremental logic
           # ... implementation

       async def get_plan(self, portfolio_hash: str):
           # Wrap existing planner_repo.get_best_result logic
           # ... implementation
   ```

3. **Update calling code**

   Before (in `app/jobs/event_based_trading.py`):
   ```python
   # Direct import and call
   from app.modules.planning.domain.holistic_planner import (
       create_holistic_plan_incremental
   )

   await create_holistic_plan_incremental(...)
   ```

   After:
   ```python
   # Use service interface
   from app.infrastructure.dependencies import get_planning_service

   planning_service = get_planning_service()
   async for update in planning_service.create_plan(request):
       print(f"Progress: {update.progress_pct}%")
   ```

4. **Test local implementation**

   File: `tests/integration/services/test_planning_service.py`

   ```python
   import pytest
   from app.modules.planning.services.local_planning_service import (
       LocalPlanningService
   )

   @pytest.mark.asyncio
   async def test_local_planning_service():
       """Test local planning service."""
       # Setup
       service = LocalPlanningService(...)

       # Execute
       request = PlanRequest(...)
       updates = []
       async for update in service.create_plan(request):
           updates.append(update)

       # Verify
       assert len(updates) > 0
       assert updates[-1].complete is True
       assert updates[-1].plan is not None
   ```

**Repeat for all 7 services:**
- Planning
- Scoring
- Optimization
- Portfolio
- Trading
- Universe
- Gateway

**Success Criteria:**
- ✅ All 7 service interfaces defined
- ✅ All 7 local implementations created
- ✅ All calling code updated to use `get_*_service()`
- ✅ All services work exactly as before (no behavior change)
- ✅ All tests pass

**Testing:**
```bash
# Run all tests - should still pass
pytest

# Verify service instantiation
python -c "
from app.infrastructure.dependencies import get_planning_service
svc = get_planning_service()
print(f'Got service: {type(svc).__name__}')
"
```

---

### Phase 3: gRPC Clients (Week 4)

**Goal:** Create gRPC client implementations (but don't use yet)

**For EACH service:**

1. **Create gRPC client**

   File: `app/modules/planning/services/grpc_planning_client.py`

   ```python
   import grpc
   from contracts import planning_pb2, planning_pb2_grpc

   class GrpcPlanningClient:
       """gRPC client for planning service."""

       def __init__(self, channel: grpc.aio.Channel):
           self.channel = channel
           self.stub = planning_pb2_grpc.PlanningServiceStub(channel)

       async def create_plan(self, request: PlanRequest):
           # Convert request to protobuf
           proto_request = self._convert_to_proto(request)

           # Call gRPC service
           async for proto_update in self.stub.CreatePlan(proto_request):
               # Convert response from protobuf
               yield self._convert_from_proto(proto_update)

       async def get_plan(self, portfolio_hash: str):
           # ... gRPC call

       def _convert_to_proto(self, request: PlanRequest):
           """Convert domain object to protobuf."""
           # ... conversion logic

       def _convert_from_proto(self, proto):
           """Convert protobuf to domain object."""
           # ... conversion logic
   ```

2. **Create conversion utilities**

   File: `app/infrastructure/grpc_helpers/converters.py`

   ```python
   """Utilities for converting between domain objects and protobuf."""

   from contracts import common_pb2
   from app.domain.models import Position, Security

   def position_to_proto(position: Position) -> common_pb2.Position:
       """Convert Position domain object to protobuf."""
       return common_pb2.Position(
           symbol=position.symbol,
           isin=position.isin,
           quantity=position.quantity,
           # ... all fields
       )

   def proto_to_position(proto: common_pb2.Position) -> Position:
       """Convert protobuf to Position domain object."""
       return Position(
           symbol=proto.symbol,
           isin=proto.isin,
           quantity=proto.quantity,
           # ... all fields
       )

   # Similar converters for Security, Trade, etc.
   ```

**Success Criteria:**
- ✅ All 7 gRPC clients implemented
- ✅ Conversion utilities for all domain objects
- ✅ Clients compile without errors
- ✅ Config still set to "local" (clients not used yet)

**Testing:**
```bash
# Verify clients can be imported
python -c "
from app.modules.planning.services.grpc_planning_client import GrpcPlanningClient
print('OK')
"
```

---

### Phase 4: gRPC Servers (Week 5-6)

**Goal:** Create standalone gRPC servers for each service

**For EACH service:**

1. **Create gRPC servicer**

   File: `services/planning/server.py`

   ```python
   import grpc
   from contracts import planning_pb2, planning_pb2_grpc
   from app.modules.planning.services.local_planning_service import (
       LocalPlanningService
   )

   class PlanningServicer(planning_pb2_grpc.PlanningServiceServicer):
       """gRPC servicer that wraps LocalPlanningService."""

       def __init__(self):
           # Initialize dependencies
           from app.infrastructure.dependencies import (
               get_scoring_service,
               get_optimization_service,
           )
           from app.modules.planning.database.planner_repository import (
               PlannerRepository
           )

           self.local_service = LocalPlanningService(
               planner_repo=PlannerRepository(),
               scoring_service=get_scoring_service(),
               optimization_service=get_optimization_service(),
           )

       async def CreatePlan(self, request, context):
           """Handle CreatePlan RPC."""
           # Convert proto to domain request
           domain_request = self._convert_request(request)

           # Call local service
           async for update in self.local_service.create_plan(domain_request):
               # Convert domain update to proto
               proto_update = self._convert_update(update)
               yield proto_update

       async def GetPlan(self, request, context):
           """Handle GetPlan RPC."""
           plan = await self.local_service.get_plan(request.portfolio_hash)

           if plan is None:
               return planning_pb2.PlanResponse(found=False)

           return planning_pb2.PlanResponse(
               found=True,
               plan=self._convert_plan(plan)
           )

       # ... other RPC methods
   ```

2. **Create server entrypoint**

   File: `services/planning/main.py`

   ```python
   import asyncio
   import signal
   import logging
   import grpc
   from concurrent import futures

   from server import PlanningServicer
   from contracts import planning_pb2_grpc
   from app.infrastructure.service_discovery import (
       load_device_config,
       should_run_service,
   )

   logger = logging.getLogger(__name__)

   async def serve():
       """Start gRPC server."""
       # Check if this device should run planning service
       if not should_run_service("planning"):
           logger.info("Planning service not configured for this device")
           return

       # Load device config
       device_config = load_device_config()

       # Create server
       server = grpc.aio.server(
           futures.ThreadPoolExecutor(max_workers=device_config.max_workers)
       )

       # Add servicer
       planning_pb2_grpc.add_PlanningServiceServicer_to_server(
           PlanningServicer(),
           server
       )

       # Bind port
       port = 50051  # TODO: Get from config
       server.add_insecure_port(f'{device_config.bind_address}:{port}')

       logger.info(f"Planning Service starting on {device_config.advertise_address}:{port}")

       await server.start()
       await server.wait_for_termination()

   if __name__ == "__main__":
       logging.basicConfig(level=logging.INFO)
       asyncio.run(serve())
   ```

3. **Create Dockerfile**

   File: `services/planning/Dockerfile`

   ```dockerfile
   FROM python:3.11-slim

   WORKDIR /app

   # Install dependencies
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   # Copy contracts package
   COPY contracts /app/contracts
   RUN pip install -e /app/contracts

   # Copy application code
   COPY app /app/app

   # Copy service code
   COPY services/planning /app/services/planning

   # Set Python path
   ENV PYTHONPATH=/app

   # Run service
   CMD ["python", "services/planning/main.py"]
   ```

4. **Create requirements.txt**

   File: `services/planning/requirements.txt`

   ```
   grpcio>=1.60.0
   grpcio-tools>=1.60.0
   protobuf>=4.25.0
   pyyaml>=6.0
   # Add any other dependencies the service needs
   ```

5. **Test gRPC server locally**

   ```bash
   # Terminal 1: Start server
   cd services/planning
   python main.py

   # Terminal 2: Test with grpcurl
   grpcurl -plaintext localhost:50051 list
   grpcurl -plaintext localhost:50051 arduino_trader.planning.PlanningService/HealthCheck
   ```

**Repeat for all 7 services**

**Success Criteria:**
- ✅ All 7 gRPC servers implemented
- ✅ All servers can start without errors
- ✅ All servers respond to HealthCheck RPC
- ✅ All services still run locally (servers not used by main app yet)

**Testing:**
```bash
# Start all services
./scripts/start_all_services.sh

# Check health of all services
./scripts/health_check.sh

# Expected output:
# ✓ Planning Service: healthy
# ✓ Scoring Service: healthy
# ✓ Optimization Service: healthy
# ✓ Portfolio Service: healthy
# ✓ Trading Service: healthy
# ✓ Universe Service: healthy
# ✓ Gateway Service: healthy
```

---

### Phase 5: Local Testing with gRPC (Week 7)

**Goal:** Test gRPC communication on localhost (all services on one device)

**Tasks:**

1. **Update configuration to use gRPC (localhost only)**

   File: `app/config/services.yaml`

   ```yaml
   deployment:
     mode: "local"  # Still local, but using gRPC

   services:
     planning:
       mode: "remote"  # Change from "local" to "remote"
       device_id: "primary"
       port: 50051
       # ...

   devices:
     primary:
       address: "localhost"  # Use localhost for testing
   ```

2. **Start all services**

   ```bash
   ./scripts/start_all_services.sh
   ```

3. **Start main app**

   ```bash
   # Main app now calls services via gRPC on localhost
   uvicorn app.main:app --reload
   ```

4. **Run end-to-end tests**

   File: `tests/e2e/test_full_trading_workflow.py`

   ```python
   @pytest.mark.asyncio
   async def test_full_trading_workflow_via_grpc():
       """Test complete workflow using gRPC services."""

       # 1. Sync portfolio (calls Universe service)
       universe_svc = get_universe_service()
       await universe_svc.sync_prices()

       # 2. Get portfolio state (calls Portfolio service)
       portfolio_svc = get_portfolio_service()
       positions = await portfolio_svc.get_positions()

       # 3. Create plan (calls Planning service, which calls Scoring)
       planning_svc = get_planning_service()
       request = PlanRequest(...)

       plan = None
       async for update in planning_svc.create_plan(request):
           if update.complete:
               plan = update.plan

       assert plan is not None
       assert len(plan.actions) > 0

       # 4. Execute trade (calls Trading service)
       trading_svc = get_trading_service()
       result = await trading_svc.execute_trade(...)

       assert result.success is True
   ```

5. **Monitor performance**

   - Measure latency of gRPC calls vs local calls
   - Should be <10ms overhead on localhost
   - If >50ms, investigate (likely serialization issue)

**Success Criteria:**
- ✅ All services communicate via gRPC on localhost
- ✅ All tests pass
- ✅ Performance acceptable (<10ms overhead)
- ✅ No behavior changes (functional equivalence)

**Testing:**
```bash
# Run full test suite
pytest

# Run e2e tests specifically
pytest tests/e2e/

# Check logs for gRPC communication
grep "gRPC" logs/*.log
```

---

### Phase 6: Dual-Device Deployment (Week 8)

**Goal:** Deploy services across 2 Arduino Uno Q devices

**Prerequisites:**
- ✅ Two Arduino Uno Q devices on same network
- ✅ Both devices can reach each other (ping test)
- ✅ SSH access to both devices

**Tasks:**

1. **Prepare Device 1 (Compute Engine)**

   ```bash
   # SSH into device 1
   ssh arduino@192.168.1.10

   # Clone repo
   cd /home/arduino/repos
   git clone https://github.com/aristath/autoTrader.git
   cd autoTrader

   # Copy device 1 config
   cp deploy/configs/dual-device/device1.yaml app/config/device.yaml
   cp deploy/configs/dual-device/services.yaml app/config/services.yaml

   # Install dependencies
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

   # Generate protos
   ./scripts/generate_protos.sh

   # Start services for this device
   ./scripts/start_services_for_device.sh

   # Expected: Planning, Scoring, Optimization services start
   ```

2. **Prepare Device 2 (Portfolio Manager)**

   ```bash
   # SSH into device 2
   ssh arduino@192.168.1.11

   # Clone repo
   cd /home/arduino/repos
   git clone https://github.com/aristath/autoTrader.git
   cd autoTrader

   # Copy device 2 config
   cp deploy/configs/dual-device/device2.yaml app/config/device.yaml
   cp deploy/configs/dual-device/services.yaml app/config/services.yaml

   # Install dependencies
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

   # Generate protos
   ./scripts/generate_protos.sh

   # Start services for this device
   ./scripts/start_services_for_device.sh

   # Expected: Portfolio, Trading, Universe, Gateway services start
   ```

3. **Verify cross-device communication**

   ```bash
   # On device 2, test connection to device 1 services
   grpcurl -plaintext 192.168.1.10:50051 \
     arduino_trader.planning.PlanningService/HealthCheck

   # Should return: {"healthy": true, "version": "1.0.0"}
   ```

4. **Test full workflow**

   ```bash
   # On device 2, access web UI
   curl http://localhost:8000/api/status

   # Should show all services healthy, including remote ones
   ```

5. **Monitor network traffic**

   ```bash
   # On device 1, monitor gRPC traffic
   sudo tcpdump -i any port 50051 -n

   # On device 2, trigger planning
   curl -X POST http://localhost:8000/api/status/jobs/planner-batch

   # Should see gRPC traffic between devices
   ```

**Success Criteria:**
- ✅ Device 1 runs Planning, Scoring, Optimization
- ✅ Device 2 runs Portfolio, Trading, Universe, Gateway
- ✅ Services communicate across network
- ✅ Full trading workflow works
- ✅ Latency acceptable (<100ms for planning calls)

**Troubleshooting:**

If services can't connect:
```bash
# Check firewall (allow gRPC ports)
sudo ufw allow 50051:50057/tcp

# Check service binding
sudo netstat -tlnp | grep 5005

# Check DNS resolution
ping 192.168.1.10
```

---

### Phase 7: Production Hardening (Week 9-10)

**Goal:** Make system production-ready

**Tasks:**

1. **Add TLS for gRPC**

   File: `app/infrastructure/grpc_helpers/tls.py`

   ```python
   import grpc
   from pathlib import Path

   def create_secure_channel(host: str, port: int) -> grpc.aio.Channel:
       """Create TLS-secured gRPC channel."""
       cert_path = Path("/etc/arduino-trader/certs/ca.pem")

       with open(cert_path, 'rb') as f:
           credentials = grpc.ssl_channel_credentials(f.read())

       return grpc.aio.secure_channel(
           f"{host}:{port}",
           credentials
       )
   ```

2. **Add retry logic with exponential backoff**

   File: `app/infrastructure/grpc_helpers/retry.py`

   ```python
   import asyncio
   import grpc
   from typing import Callable, TypeVar, Any

   T = TypeVar('T')

   async def retry_grpc_call(
       func: Callable[[], T],
       max_retries: int = 3,
       backoff_ms: int = 1000
   ) -> T:
       """Retry gRPC call with exponential backoff."""
       last_error = None

       for attempt in range(max_retries):
           try:
               return await func()
           except grpc.RpcError as e:
               last_error = e

               # Don't retry on certain errors
               if e.code() in [
                   grpc.StatusCode.INVALID_ARGUMENT,
                   grpc.StatusCode.NOT_FOUND,
               ]:
                   raise

               # Exponential backoff
               if attempt < max_retries - 1:
                   delay = (backoff_ms / 1000) * (2 ** attempt)
                   await asyncio.sleep(delay)

       raise last_error
   ```

3. **Add circuit breaker**

   File: `app/infrastructure/grpc_helpers/circuit_breaker.py`

   ```python
   import time
   from dataclasses import dataclass
   from enum import Enum

   class CircuitState(Enum):
       CLOSED = "closed"    # Normal operation
       OPEN = "open"        # Failures, reject calls
       HALF_OPEN = "half_open"  # Testing recovery

   @dataclass
   class CircuitBreakerConfig:
       failure_threshold: int = 5
       timeout_seconds: int = 60
       success_threshold: int = 2

   class CircuitBreaker:
       """Circuit breaker for service calls."""

       def __init__(self, config: CircuitBreakerConfig):
           self.config = config
           self.state = CircuitState.CLOSED
           self.failures = 0
           self.successes = 0
           self.last_failure_time = None

       async def call(self, func):
           """Execute function through circuit breaker."""

           # Check if circuit is open
           if self.state == CircuitState.OPEN:
               # Check if timeout has passed
               if time.time() - self.last_failure_time > self.config.timeout_seconds:
                   self.state = CircuitState.HALF_OPEN
                   self.successes = 0
               else:
                   raise Exception("Circuit breaker is OPEN")

           try:
               result = await func()
               self._on_success()
               return result
           except Exception as e:
               self._on_failure()
               raise e

       def _on_success(self):
           """Handle successful call."""
           if self.state == CircuitState.HALF_OPEN:
               self.successes += 1
               if self.successes >= self.config.success_threshold:
                   self.state = CircuitState.CLOSED
                   self.failures = 0

           self.failures = 0

       def _on_failure(self):
           """Handle failed call."""
           self.failures += 1
           self.last_failure_time = time.time()

           if self.failures >= self.config.failure_threshold:
               self.state = CircuitState.OPEN
   ```

4. **Add health checks**

   File: `app/infrastructure/service_discovery/health_checker.py`

   ```python
   import asyncio
   import grpc
   from typing import Dict
   from contracts import common_pb2

   class HealthChecker:
       """Monitors health of all services."""

       def __init__(self, service_locator):
           self.service_locator = service_locator
           self.health_status: Dict[str, bool] = {}

       async def check_all_services(self) -> Dict[str, bool]:
           """Check health of all services."""
           services = [
               "planning", "scoring", "optimization",
               "portfolio", "trading", "universe", "gateway"
           ]

           tasks = [
               self.check_service(svc) for svc in services
           ]

           results = await asyncio.gather(*tasks, return_exceptions=True)

           return {
               svc: (results[i] is True)
               for i, svc in enumerate(services)
           }

       async def check_service(self, service_name: str) -> bool:
           """Check health of a single service."""
           try:
               location = self.service_locator.get_service_location(service_name)

               if location.mode == "local":
                   return True  # Assume local services are healthy

               # Call HealthCheck RPC
               channel = self.service_locator.create_channel(service_name)
               stub = self._get_stub_for_service(service_name, channel)

               response = await stub.HealthCheck(
                   common_pb2.Empty(),
                   timeout=5
               )

               return response.healthy

           except Exception as e:
               print(f"Health check failed for {service_name}: {e}")
               return False
   ```

5. **Add monitoring/metrics**

   File: `app/infrastructure/monitoring/metrics.py`

   ```python
   from dataclasses import dataclass
   from datetime import datetime
   import time

   @dataclass
   class ServiceMetrics:
       """Metrics for a service."""
       service_name: str
       total_calls: int = 0
       failed_calls: int = 0
       total_latency_ms: float = 0
       min_latency_ms: float = float('inf')
       max_latency_ms: float = 0

   class MetricsCollector:
       """Collects metrics for service calls."""

       def __init__(self):
           self.metrics: Dict[str, ServiceMetrics] = {}

       def record_call(
           self,
           service_name: str,
           latency_ms: float,
           success: bool
       ):
           """Record a service call."""
           if service_name not in self.metrics:
               self.metrics[service_name] = ServiceMetrics(service_name)

           m = self.metrics[service_name]
           m.total_calls += 1
           m.total_latency_ms += latency_ms
           m.min_latency_ms = min(m.min_latency_ms, latency_ms)
           m.max_latency_ms = max(m.max_latency_ms, latency_ms)

           if not success:
               m.failed_calls += 1

       def get_metrics(self, service_name: str) -> dict:
           """Get metrics for a service."""
           if service_name not in self.metrics:
               return {}

           m = self.metrics[service_name]

           return {
               "total_calls": m.total_calls,
               "failed_calls": m.failed_calls,
               "success_rate": (
                   (m.total_calls - m.failed_calls) / m.total_calls
                   if m.total_calls > 0 else 0
               ),
               "avg_latency_ms": (
                   m.total_latency_ms / m.total_calls
                   if m.total_calls > 0 else 0
               ),
               "min_latency_ms": (
                   m.min_latency_ms if m.min_latency_ms < float('inf') else 0
               ),
               "max_latency_ms": m.max_latency_ms,
           }
   ```

6. **Add logging interceptor**

   File: `app/infrastructure/grpc_helpers/interceptors.py`

   ```python
   import grpc
   import time
   import logging

   logger = logging.getLogger(__name__)

   class LoggingInterceptor(grpc.aio.UnaryUnaryClientInterceptor):
       """Logs all gRPC calls."""

       async def intercept_unary_unary(self, continuation, client_call_details, request):
           """Intercept unary-unary call."""
           method = client_call_details.method
           start_time = time.time()

           logger.info(f"gRPC call started: {method}")

           try:
               response = await continuation(client_call_details, request)
               latency_ms = (time.time() - start_time) * 1000
               logger.info(f"gRPC call succeeded: {method} ({latency_ms:.2f}ms)")
               return response
           except grpc.RpcError as e:
               latency_ms = (time.time() - start_time) * 1000
               logger.error(
                   f"gRPC call failed: {method} ({latency_ms:.2f}ms) - {e.code()}: {e.details()}"
               )
               raise
   ```

**Success Criteria:**
- ✅ TLS encryption for all gRPC communication
- ✅ Automatic retries with backoff
- ✅ Circuit breakers prevent cascading failures
- ✅ Health checks run every 30 seconds
- ✅ Metrics tracked for all service calls
- ✅ All calls logged with latency

---

## 7. Testing Strategy

### Unit Tests

**Location:** `tests/unit/`

**Coverage:**
- Service interfaces (mock implementations)
- Domain logic (unchanged)
- Converters (proto ↔ domain)

**Example:**

```python
# tests/unit/services/test_planning_service_interface.py
from unittest.mock import AsyncMock
import pytest

@pytest.mark.asyncio
async def test_planning_service_interface():
    """Test that interface is followed."""
    mock_service = AsyncMock()

    # Mock should follow interface
    request = PlanRequest(...)
    await mock_service.create_plan(request)

    mock_service.create_plan.assert_called_once()
```

### Integration Tests

**Location:** `tests/integration/services/`

**Coverage:**
- Each service in isolation (local implementation)
- gRPC clients and servers
- Proto serialization/deserialization

**Example:**

```python
# tests/integration/services/test_planning_grpc.py
import pytest
import grpc

@pytest.mark.asyncio
async def test_planning_service_grpc():
    """Test planning service via gRPC."""
    # Start gRPC server in background
    server = await start_planning_server()

    # Create client
    channel = grpc.aio.insecure_channel('localhost:50051')
    client = GrpcPlanningClient(channel)

    # Make call
    request = PlanRequest(...)
    result = await client.create_plan(request)

    # Verify
    assert result is not None

    # Cleanup
    await server.stop()
    await channel.close()
```

### End-to-End Tests

**Location:** `tests/e2e/`

**Coverage:**
- Full workflows (sync → plan → trade)
- Cross-service communication
- Failure scenarios

**Example:**

```python
# tests/e2e/test_full_workflow.py
@pytest.mark.asyncio
async def test_complete_trading_cycle():
    """Test complete trading cycle across all services."""

    # 1. Sync portfolio
    universe_svc = get_universe_service()
    await universe_svc.sync_prices()

    # 2. Get positions
    portfolio_svc = get_portfolio_service()
    positions = await portfolio_svc.get_positions()
    assert len(positions) > 0

    # 3. Create plan
    planning_svc = get_planning_service()
    plan = await create_and_wait_for_plan(planning_svc)
    assert plan is not None

    # 4. Execute trade
    trading_svc = get_trading_service()
    result = await trading_svc.execute_trade(plan.actions[0])
    assert result.success is True
```

### Failure Scenario Tests

**Location:** `tests/e2e/test_failure_scenarios.py`

**Coverage:**
- Service down (planning service unreachable)
- Network partition (devices can't communicate)
- Slow services (timeouts)
- Partial failures (scoring works, planning fails)

**Example:**

```python
@pytest.mark.asyncio
async def test_planning_service_down():
    """Test behavior when planning service is down."""

    # Stop planning service
    await stop_service("planning")

    # Try to create plan
    planning_svc = get_planning_service()

    with pytest.raises(grpc.RpcError) as exc_info:
        await planning_svc.create_plan(request)

    # Should fail with UNAVAILABLE
    assert exc_info.value.code() == grpc.StatusCode.UNAVAILABLE

    # App should fallback to cached plan
    cached_plan = await get_cached_plan()
    assert cached_plan is not None
```

---

## 8. Deployment Strategy

### Single Device Deployment

**Use Case:** Development, testing, initial deployment

**Configuration:**
- `device.yaml`: `id: "primary"`, `roles: ["all"]`
- `services.yaml`: All services `mode: "local"`

**Deployment:**

```bash
# On Arduino Uno Q
cd /home/arduino/arduino-trader

# Copy single-device config
cp deploy/configs/single-device/device.yaml app/config/
cp deploy/configs/single-device/services.yaml app/config/

# Start app (all services run in-process)
sudo systemctl restart arduino-trader
```

**Advantages:**
- ✅ Simplest deployment
- ✅ No network overhead
- ✅ Easy debugging

**Disadvantages:**
- ⚠️ All load on one device
- ⚠️ Can't isolate failures

---

### Dual Device Deployment

**Use Case:** Production, load distribution

**Device 1 (Compute):**
```bash
# Copy device 1 config
cp deploy/configs/dual-device/device1.yaml app/config/device.yaml
cp deploy/configs/dual-device/services.yaml app/config/services.yaml

# Start only services for this device
./scripts/start_services_for_device.sh
```

**Device 2 (Portfolio Manager):**
```bash
# Copy device 2 config
cp deploy/configs/dual-device/device2.yaml app/config/device.yaml
cp deploy/configs/dual-device/services.yaml app/config/services.yaml

# Start services for this device
./scripts/start_services_for_device.sh
```

**Advantages:**
- ✅ Load balanced across devices
- ✅ Fault isolation (compute vs state)
- ✅ Can reboot compute without affecting state

**Disadvantages:**
- ⚠️ Network latency (~10-50ms)
- ⚠️ More complex deployment

---

### Docker Deployment

**Use Case:** Consistent environments, easy rollback

**File:** `deploy/docker/docker-compose.single.yml`

```yaml
version: '3.8'

services:
  planning:
    build:
      context: ../..
      dockerfile: services/planning/Dockerfile
    ports:
      - "50051:50051"
    volumes:
      - ../../data:/app/data
      - ../../app/config:/app/app/config
    restart: unless-stopped

  scoring:
    build:
      context: ../..
      dockerfile: services/scoring/Dockerfile
    ports:
      - "50052:50052"
    volumes:
      - ../../data:/app/data
      - ../../app/config:/app/app/config
    restart: unless-stopped

  # ... other services

  gateway:
    build:
      context: ../..
      dockerfile: services/gateway/Dockerfile
    ports:
      - "8000:8000"  # Web UI
      - "50057:50057"  # gRPC
    volumes:
      - ../../data:/app/data
      - ../../app/config:/app/app/config
      - ../../static:/app/static
    restart: unless-stopped
    depends_on:
      - planning
      - scoring
      - portfolio
      - trading
      - universe
```

**Deploy:**

```bash
# Build and start all services
docker-compose -f deploy/docker/docker-compose.single.yml up -d

# View logs
docker-compose -f deploy/docker/docker-compose.single.yml logs -f

# Stop all
docker-compose -f deploy/docker/docker-compose.single.yml down
```

---

### Systemd Services

**Use Case:** Native Linux deployment, auto-restart

**File:** `deploy/systemd/arduino-trader-planning.service`

```ini
[Unit]
Description=Arduino Trader - Planning Service
After=network.target

[Service]
Type=simple
User=arduino
WorkingDirectory=/home/arduino/arduino-trader
Environment="PYTHONPATH=/home/arduino/arduino-trader"
Environment="DEVICE_CONFIG_PATH=/home/arduino/arduino-trader/app/config/device.yaml"
ExecStart=/home/arduino/arduino-trader/venv/bin/python services/planning/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Install:**

```bash
# Copy service files
sudo cp deploy/systemd/*.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable arduino-trader-planning
sudo systemctl enable arduino-trader-scoring
# ... etc

# Start services
sudo systemctl start arduino-trader-planning
sudo systemctl start arduino-trader-scoring

# Check status
sudo systemctl status arduino-trader-*
```

---

## 9. Load Balancing

### Optimal Service Distribution

**For 2 Arduino Uno Q devices:**

#### Option 1: Compute vs State (Recommended for Start)

**Device 1 (Compute Engine):**
- Planning Service (CPU-intensive)
- Scoring Service (CPU-intensive)
- Optimization Service (CPU-intensive)

**Device 2 (Portfolio Manager):**
- Portfolio Service (I/O, state)
- Trading Service (I/O, broker API)
- Universe Service (I/O, external APIs)
- Gateway Service (Web UI, orchestration)

**Pros:**
- ✅ Clear separation (compute vs state)
- ✅ Easy to reason about
- ✅ Planning can use full CPU of Device 1

**Cons:**
- ⚠️ Device 1 may sit idle when not planning
- ⚠️ Device 2 handles more services

---

#### Option 2: Balanced Distribution

**Device 1:**
- Planning Service (heavy)
- Scoring Service (medium)
- Universe Service (light, I/O)

**Device 2:**
- Portfolio Service (medium, critical)
- Trading Service (medium, critical)
- Optimization Service (light)
- Gateway Service (light, UI)

**Pros:**
- ✅ More balanced CPU usage
- ✅ Both devices active most of the time
- ✅ Can run more services on each device

**Cons:**
- ⚠️ More complex (less obvious separation)
- ⚠️ Need to monitor resource usage

---

#### Option 3: Critical vs Non-Critical

**Device 1 (Critical Path):**
- Portfolio Service (must be up)
- Trading Service (must be up)
- Gateway Service (UI access)

**Device 2 (Background):**
- Planning Service (can cache plans)
- Scoring Service (can cache scores)
- Optimization Service (optional)
- Universe Service (can delay sync)

**Pros:**
- ✅ Critical services isolated
- ✅ Can reboot Device 2 without stopping trading
- ✅ Better availability

**Cons:**
- ⚠️ Device 1 has more load
- ⚠️ Planning latency if Device 2 slow

---

### Dynamic Service Migration

**Scenario:** Need to move a service from Device 1 to Device 2

**Steps:**

1. **Update configuration on both devices**

   Device 1 (`app/config/device.yaml`):
   ```yaml
   device:
     roles:
       - "scoring"       # Remove "planning"
       - "optimization"
   ```

   Device 2 (`app/config/device.yaml`):
   ```yaml
   device:
     roles:
       - "planning"      # Add "planning"
       - "portfolio"
       - "trading"
       - "universe"
       - "gateway"
   ```

2. **Update service discovery (`app/config/services.yaml` on both devices)**

   ```yaml
   services:
     planning:
       mode: "remote"
       device_id: "primary"  # Changed from "compute-1"
       port: 50051
   ```

3. **Stop planning service on Device 1**

   ```bash
   # On Device 1
   sudo systemctl stop arduino-trader-planning
   ```

4. **Start planning service on Device 2**

   ```bash
   # On Device 2
   sudo systemctl start arduino-trader-planning
   ```

5. **Verify health**

   ```bash
   # On Device 2
   grpcurl -plaintext localhost:50051 \
     arduino_trader.planning.PlanningService/HealthCheck
   ```

6. **Test from other services**

   ```bash
   # Trigger a planning cycle
   curl -X POST http://localhost:8000/api/status/jobs/planner-batch

   # Should now call planning service on Device 2 instead of Device 1
   ```

**No code changes required!** Just configuration updates.

---

## 10. Monitoring & Observability

### Health Checks

**Endpoint:** Each service exposes `HealthCheck` RPC

**Monitor script:** `scripts/health_check.sh`

```bash
#!/bin/bash

SERVICES=(
  "planning:50051"
  "scoring:50052"
  "optimization:50053"
  "portfolio:50054"
  "trading:50055"
  "universe:50056"
  "gateway:50057"
)

for svc in "${SERVICES[@]}"; do
  name="${svc%:*}"
  port="${svc#*:}"

  result=$(grpcurl -plaintext localhost:$port \
    arduino_trader.$name.${name^}Service/HealthCheck 2>&1)

  if echo "$result" | grep -q '"healthy": true'; then
    echo "✓ $name: healthy"
  else
    echo "✗ $name: UNHEALTHY"
  fi
done
```

**Run periodically:**

```bash
# Add to crontab
*/5 * * * * /home/arduino/arduino-trader/scripts/health_check.sh >> /var/log/arduino-trader/health.log
```

---

### Metrics Collection

**Expose metrics endpoint in Gateway:**

```python
# app/modules/gateway/api/metrics.py
from fastapi import APIRouter
from app.infrastructure.monitoring.metrics import get_metrics_collector

router = APIRouter()

@router.get("/api/metrics")
async def get_metrics():
    """Get metrics for all services."""
    collector = get_metrics_collector()

    return {
        "planning": collector.get_metrics("planning"),
        "scoring": collector.get_metrics("scoring"),
        "optimization": collector.get_metrics("optimization"),
        "portfolio": collector.get_metrics("portfolio"),
        "trading": collector.get_metrics("trading"),
        "universe": collector.get_metrics("universe"),
        "gateway": collector.get_metrics("gateway"),
    }
```

**View metrics:**

```bash
curl http://localhost:8000/api/metrics | jq
```

**Output:**

```json
{
  "planning": {
    "total_calls": 150,
    "failed_calls": 2,
    "success_rate": 0.9867,
    "avg_latency_ms": 45.3,
    "min_latency_ms": 12.1,
    "max_latency_ms": 312.5
  },
  "scoring": {
    "total_calls": 1250,
    "failed_calls": 0,
    "success_rate": 1.0,
    "avg_latency_ms": 8.2,
    "min_latency_ms": 3.1,
    "max_latency_ms": 45.7
  }
}
```

---

### Logging

**Structured logging for all gRPC calls:**

```python
# In interceptor
logger.info(
    "grpc_call",
    extra={
        "service": "planning",
        "method": "CreatePlan",
        "latency_ms": 45.3,
        "success": True,
        "client_device": "primary",
        "server_device": "compute-1",
    }
)
```

**Centralized log aggregation:**

```bash
# On each device, forward logs to central location
# /etc/rsyslog.d/arduino-trader.conf
:programname, isequal, "arduino-trader" @@192.168.1.100:514
```

---

### Alerting

**Monitor for:**

1. **Service down** - Health check fails 3 times in a row
2. **High latency** - avg_latency > 1000ms for 5 minutes
3. **High error rate** - success_rate < 0.95
4. **Circuit breaker open** - Any circuit breaker in OPEN state

**Simple alerting script:**

```python
# scripts/alert_checker.py
import requests
import smtplib

def check_and_alert():
    # Get metrics
    metrics = requests.get("http://localhost:8000/api/metrics").json()

    alerts = []

    for svc, m in metrics.items():
        # Check error rate
        if m["success_rate"] < 0.95:
            alerts.append(f"{svc}: High error rate ({m['success_rate']:.2%})")

        # Check latency
        if m["avg_latency_ms"] > 1000:
            alerts.append(f"{svc}: High latency ({m['avg_latency_ms']:.0f}ms)")

    if alerts:
        send_alert_email("\n".join(alerts))

if __name__ == "__main__":
    check_and_alert()
```

---

## 11. Rollback Strategy

### Rollback Scenarios

#### Scenario 1: Service Fails After Deployment

**Symptoms:**
- Health checks fail
- gRPC calls return errors
- Logs show exceptions

**Rollback:**

```bash
# On affected device

# 1. Stop new version
sudo systemctl stop arduino-trader-planning

# 2. Switch to previous version
cd /home/arduino/arduino-trader
git checkout HEAD~1  # or specific commit

# 3. Restart service
sudo systemctl start arduino-trader-planning

# 4. Verify health
grpcurl -plaintext localhost:50051 \
  arduino_trader.planning.PlanningService/HealthCheck
```

**Time:** ~2 minutes

---

#### Scenario 2: Configuration Error

**Symptoms:**
- Service won't start
- Config parsing errors in logs

**Rollback:**

```bash
# Restore previous config
cp app/config/device.yaml.backup app/config/device.yaml
cp app/config/services.yaml.backup app/config/services.yaml

# Restart services
./scripts/start_services_for_device.sh
```

**Time:** ~30 seconds

---

#### Scenario 3: Network Issues Between Devices

**Symptoms:**
- gRPC calls timeout
- UNAVAILABLE errors
- High latency

**Rollback to single-device:**

```bash
# On Device 2 (portfolio manager)

# 1. Copy single-device config
cp deploy/configs/single-device/device.yaml app/config/
cp deploy/configs/single-device/services.yaml app/config/

# 2. Start all services locally
./scripts/start_all_services.sh

# 3. Restart main app
sudo systemctl restart arduino-trader
```

**Time:** ~3 minutes

**Result:** All services run on Device 2, Device 1 unused

---

### Blue-Green Deployment

For zero-downtime deployments:

1. **Deploy to "green" device**

   ```bash
   # Device 3 (new)
   # Deploy new version
   ```

2. **Update service discovery to point to green**

   ```yaml
   # services.yaml
   devices:
     compute-1:
       address: "192.168.1.12"  # New device
   ```

3. **Monitor green device**

   - Watch metrics, errors
   - If problems, switch back to blue

4. **Decommission blue device**

---

## 12. Performance Considerations

### Expected Latencies

**Local (in-process) calls:**
- Planning: 10-60 seconds (compute-bound)
- Scoring: 5-50ms per call
- Optimization: 1-5 seconds
- Portfolio: 1-10ms
- Trading: 100-500ms (broker API)
- Universe: 50-200ms (external API)

**gRPC (same device):**
- Add ~1-5ms overhead (serialization)

**gRPC (cross-device):**
- Add ~10-50ms overhead (network + serialization)

---

### Optimization Tips

1. **Batch calls when possible**

   Bad:
   ```python
   for position in positions:
       score = await scoring_svc.score_security(position.isin)
   ```

   Good:
   ```python
   scores = await scoring_svc.batch_score_securities(
       [p.isin for p in positions]
   )
   ```

2. **Use streaming for long operations**

   ```python
   # Get progress updates during planning
   async for update in planning_svc.create_plan(request):
       update_led_display(f"PLANNING {update.progress_pct:.0f}%")
   ```

3. **Cache aggressively**

   ```python
   # Cache portfolio scores (TTL: 5 minutes)
   @cached(ttl=300)
   async def get_portfolio_score():
       return await scoring_svc.score_portfolio(...)
   ```

4. **Use circuit breakers**

   - Prevent cascading failures
   - Fail fast when service is down
   - Allow time to recover

5. **Connection pooling**

   - Reuse gRPC channels
   - Don't create new channel per call

---

### Resource Limits

**Arduino Uno Q specs:**
- CPU: Quad-core ARM Cortex-A53
- RAM: 2GB
- Storage: 16GB eMMC

**Per-service limits:**

```yaml
# services.yaml
resources:
  planning:
    max_workers: 4      # Thread pool size
    max_memory_mb: 512

  scoring:
    max_workers: 4
    max_memory_mb: 256

  # ... etc
```

**Monitor resource usage:**

```bash
# CPU usage
top -b -n 1 | grep python

# Memory usage
ps aux | grep python | awk '{sum+=$4} END {print sum "%"}'

# Network usage
iftop -i eth0
```

---

## Summary

This implementation plan provides a complete, step-by-step guide to migrating Arduino Trader from a monolithic architecture to 7 microservices using gRPC.

**Key Benefits:**
- ✅ Proper separation of concerns (7 independent services)
- ✅ Independent deployability (reboot/replace individual services)
- ✅ Fault isolation (failures don't cascade)
- ✅ Load balancing (distribute across devices)
- ✅ Single codebase (config-driven deployment)
- ✅ Progressive migration (start local, scale distributed)

**Timeline:** ~10 weeks from start to production-ready

**Next Steps:**
1. Review this plan
2. Set up development environment
3. Begin Phase 1: Preparation
4. Follow phases sequentially
5. Test thoroughly at each phase
6. Deploy incrementally

For questions or clarifications, refer to specific sections above.

---

**Document Version:** 1.0
**Last Updated:** 2026-01-01
**Status:** Ready for Implementation ✅
