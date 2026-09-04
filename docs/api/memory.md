# AI memory

Base path: `/api/memory`

These Clara-compatible endpoints use the configured PostgreSQL/pgvector memory
store. They are an optional AI satellite, not Sentinel's SQLite database.

## `POST /api/memory/dedup-store`

Stores or deduplicates one research memory:

```json
{
  "memory": "Finding text",
  "tags": ["security:AIR.EU", "industry:aerospace"],
  "metadata": {
    "source": "analyze-security"
  }
}
```

`memory` is converted to text; `tags` and `metadata` are forwarded to the memory
store. The response is the store's result, including whether a new record was
created or an existing finding matched.

## `GET /api/memory/memories`

Fetches stored findings.

| Parameter | Default | Constraint |
|---|---:|---|
| `tag` | empty | Comma-separated tag filter |
| `limit` | `100` | 1 through 500 |
| `offset` | `0` | Zero or greater |
| `since` | omitted | Optional store-supported timestamp filter |

Response:

```json
{
  "items": []
}
```
