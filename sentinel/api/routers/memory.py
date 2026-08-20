"""Clara-compatible memory endpoints used by the ported task scripts."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query

from sentinel.ai.memory import make_memory_store
from sentinel.api.dependencies import CommonDependencies, get_common_deps

router = APIRouter(prefix="/memory", tags=["memory"])


@router.post("/dedup-store")
async def dedup_store(
    body: dict[str, Any], deps: Annotated[CommonDependencies, Depends(get_common_deps)]
) -> dict[str, Any]:
    store = await make_memory_store(deps.settings)
    try:
        return await store.store(str(body.get("memory") or ""), body.get("tags"), body.get("metadata"))
    finally:
        await store.close()


@router.get("/memories")
async def memories(
    deps: Annotated[CommonDependencies, Depends(get_common_deps)],
    tag: str = "",
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    since: str | None = None,
) -> dict[str, Any]:
    tags = [item.strip() for item in tag.split(",") if item.strip()]
    store = await make_memory_store(deps.settings)
    try:
        return {"items": await store.fetch(tags, since=since, limit=limit, offset=offset)}
    finally:
        await store.close()
