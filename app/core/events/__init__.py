"""Event system for decoupled LED and system notifications."""

from app.core.events.events import SystemEvent, emit, subscribe

__all__ = ["SystemEvent", "emit", "subscribe"]
