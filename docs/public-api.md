# TendX Public API (v1)

The public API exposes read access to a company's tenders and matches so
Enterprise customers can pull TendX intelligence into their own systems. It
shares the same data layer as the web app (Build Spec section 8).

- **Plan:** Enterprise (Build Spec section 10). Keys are issued from
  **Settings → API access**.
- **Base path:** `/api/v1`
- **Auth:** send the key as `Authorization: Bearer <token>` or `x-api-key: <token>`.
- **Rate limit:** 60 requests / minute / key (fixed window). Responses carry
  `X-RateLimit-Limit` and `X-RateLimit-Remaining`; a `429` includes `Retry-After`.
  In production this moves to a shared store (Redis/Upstash) so limits hold
  across instances.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/tenders` | Paginated tenders. Query: `keyword`, `sector`, `province`, `buyerType`, `sort` (`score`\|`deadline`\|`value`\|`recency`), `limit` (≤100, default 20), `offset`. |
| GET | `/api/v1/tenders/:id` | A single tender with its match. |
| GET | `/api/v1/matches` | The company's tender matches with scores. |

## Responses

```jsonc
// GET /api/v1/tenders
{
  "data": [ { "id": "...", "title": "...", "valuePkr": 24000000, "match": { "score": 92 } } ],
  "pagination": { "total": 4, "limit": 20, "offset": 0 }
}
```

Errors: `401` (missing/invalid key), `404` (unknown id), `429` (rate limited).

## Key management

| Method | Path | Notes |
|---|---|---|
| GET | `/api/keys` | List masked keys (Enterprise + admin/owner). |
| POST | `/api/keys` | Issue a key; the raw token is returned **once**. |
| DELETE | `/api/keys/:id` | Revoke a key. |

Only a SHA-256 hash of each token is stored; the raw token is never recoverable
after creation. Revoked keys stop authenticating immediately.

## Example

```bash
curl https://app.tendx.pk/api/v1/tenders?sort=score&limit=5 \
  -H "Authorization: Bearer tendx_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```
