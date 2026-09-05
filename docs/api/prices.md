# Prices

Base path: `/api/prices`

Bulk price operations across the full security universe. For per-security price history and sync, see [Securities](securities.md).

---

## `POST /api/prices/sync-all`

Syncs historical prices for all securities that have fewer than 100 days of price data. No-op if all securities are already populated.
Broker failures and responses missing usable prices for any requested security are reported as errors. Usable series returned for
other requested securities are still saved, so retrying only needs to fill the remaining gaps.

**Response**
```json
{ "status": "ok" }
```
