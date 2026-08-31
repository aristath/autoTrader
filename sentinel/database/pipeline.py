"""Serialization boundary for production database operations."""

from __future__ import annotations

import asyncio
import inspect
from collections.abc import Awaitable, Callable
from functools import wraps
from typing import Any, TypeVar

import aiosqlite

Result = TypeVar("Result")
DatabaseClass = TypeVar("DatabaseClass", bound=type[Any])


class SQLiteOperationPipeline:
    """Run complete database methods one at a time on a single connection."""

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._owner: asyncio.Task[Any] | None = None

    async def run(
        self,
        database: Any,
        operation: Callable[..., Awaitable[Result]],
        *args: Any,
        **kwargs: Any,
    ) -> Result:
        current = asyncio.current_task()
        if current is not None and self._owner is current:
            return await operation(database, *args, **kwargs)

        async with self._lock:
            self._owner = current
            try:
                result = await operation(database, *args, **kwargs)
                connection = database._connection
                if connection is not None and connection.in_transaction:
                    await connection.rollback()
                    raise RuntimeError(f"Database operation {operation.__qualname__} left a transaction open")
                return result
            except BaseException:
                await self._rollback(database._connection)
                raise
            finally:
                self._owner = None

    @staticmethod
    async def _rollback(connection: aiosqlite.Connection | None) -> None:
        if connection is not None and connection.in_transaction:
            await connection.rollback()


def serialized_database(cls: DatabaseClass) -> DatabaseClass:
    """Serialize every public async method exposed by the production database."""

    methods: dict[str, Callable[..., Awaitable[Any]]] = {}
    for base in reversed(cls.__mro__):
        for name, value in vars(base).items():
            if name.startswith("_") or name in {"connect", "close"}:
                continue
            if inspect.iscoroutinefunction(value):
                methods[name] = value

    for name, method in methods.items():

        @wraps(method)
        async def serialized(self: Any, *args: Any, __method: Callable[..., Awaitable[Any]] = method, **kwargs: Any):
            return await self._operation_pipeline.run(self, __method, *args, **kwargs)

        setattr(cls, name, serialized)

    return cls
