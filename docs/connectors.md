# Connectors — design (Phase 4)

Status: **design only.** The connector contract and catalogue exist in
`src/server/connectors/`; every connector is `planned` and its `sync()` throws
`NotImplementedError`. This document describes the ingestion/integration service
that implements them. It realises the "Connectors service" on the scale-up path
(Build Spec section 3) and the Phase 4 goal in section 12. Real ingestion is
explicitly out of scope until built (section 15).

## Goals

1. Replace the manual "import tender by paste/URL" path with automated ingestion
   from EPADS/PPRA and the provincial portals.
2. Pull FBR taxpayer/rate data to harden eligibility and the tax calculator.
3. Wire payment gateways so plan changes become real billing (section 15 notes
   payments are wired in Phase 4).

## The contract

```ts
interface Connector extends ConnectorInfo {
  sync(): Promise<IngestResult>; // fetched / imported / skipped / ranAt
}
```

`ConnectorInfo` carries `kind` (`tender_portal | tax | payment`), `authType`
(`scraper | api_key | oauth2 | credentials | none`), `status`, `region`,
`ingests`, and `cadence`. The catalogue lives in `registry.ts`:

| Kind | Connectors |
|---|---|
| Tender portals | EPADS, PPRA Federal, Punjab PPRA (PPMS), Sindh SPPRA, KPK PPRA, Balochistan PPRA |
| Tax data | FBR (IRIS) |
| Payment | PayFast (1LINK), Easypaisa, JazzCash |

## Architecture

```
            ┌────────────┐   enqueue    ┌───────────────┐
 scheduler ─▶  sync jobs  ├────────────▶│  BullMQ (Redis)│
 (cron)     └────────────┘              └───────┬───────┘
                                                │ worker pool
                            ┌───────────────────▼───────────────────┐
                            │           Connector.sync()            │
                            │  fetch → parse → normalize → dedupe   │
                            └───────────────────┬───────────────────┘
                                                │
        raw docs ─▶ document store (jsonb→Mongo)│ normalized rows
                                                ▼
                        Postgres: tenders, tender_matches  ──▶ pgvector match
                                                ▼
                        Elasticsearch (full-text tender search)
```

- **Scheduler:** cron triggers per-connector jobs at each connector's `cadence`
  (e.g. EPADS every 30 min, BPPRA daily). Jobs are enqueued, never run inline, so
  HTTP requests never block (Build Spec section 3, background jobs).
- **Queue:** BullMQ on Redis (Upstash in prod). Concurrency and per-portal rate
  limits live here; failed jobs retry with backoff and land in a dead-letter
  queue for inspection.
- **Workers:** run `Connector.sync()`. Each connector owns its fetch + parse:
  - *scraper* portals (PPRA, provincial) fetch public HTML/PDF listings;
  - *credentials* (EPADS) authenticate first, then page through notices;
  - *api_key* (FBR, gateways) call documented REST endpoints.

## Tender ingestion pipeline

1. **Fetch** the source listing/detail pages or API.
2. **Parse** into a raw document `{ source, raw_text, attachments, sections }`
   stored in the document store (`jsonb` now → MongoDB later, section 7.2).
3. **Normalize** to the canonical `Tender` shape used everywhere else
   (`src/server/data/fixtures.ts` / `src/server/types.ts`): `refNo`, `title`,
   `buyer`, `sector`, `category`, `valuePkr`, `city`, `province`, `buyerType`,
   `publishedAt`, `closesAt`, `sourcePortal`, `rawUrl`. This is the same shape
   the existing in-memory store and `prisma/seed.ts` consume, so nothing
   downstream (matching, analyzer, feed) changes.
4. **Dedupe** by `(sourcePortal, refNo)`; corrigenda update the existing row
   rather than inserting a duplicate.
5. **Extract + match** by reusing the existing pipeline: `lib/ai`
   `extractRequirements` → `server/matching.ts` eligibility + score (cached on
   `tender_matches`). The LLM never touches scoring or money (section 9.5),
   exactly as today.
6. **Index** the normalized tender into Elasticsearch for full-text search once
   `pgvector`/SQL search is outgrown (section 3 scale-up).

`IngestResult { fetched, imported, skipped, ranAt }` is reported back to the
queue for observability (metrics, last-run timestamps shown in Settings →
Integrations).

## FBR (IRIS) tax connector

- Verify a company's NTN/STRN and active-taxpayer status during onboarding and
  before a bid is marked submitted (hardens the eligibility checks in §6.3).
- Sync current GST / withholding / SST rate tables so the deterministic
  calculator (`server/tax.ts`) uses live rates instead of constants. The
  calculator stays deterministic; the connector only refreshes its inputs.

## Payment gateways

- **Checkout:** plan change → create a charge via PayFast (1LINK) / Easypaisa /
  JazzCash → redirect/collect → gateway webhook confirms.
- **Webhooks** (`success | failure | refund | chargeback`) update the
  `subscriptions` row (section 7.1) and flip the plan that `server/plan.ts`
  currently reads from the `tendx_plan` cookie. The cookie switcher is replaced;
  gating logic is unchanged.
- Idempotency keys on charges; webhook signatures verified before any state
  change.

## Security & operations

- Per-portal credentials/API keys in a secrets manager, never in code
  (section 13). Scrapers respect robots/rate limits and back off on 429/5xx.
- Each connector run is traced; alerts fire on repeated failures or zero-fetch
  anomalies. Schema drift in a portal fails that connector in isolation without
  affecting the others or the app.

## Build order

1. PPRA Federal + EPADS (highest tender volume) behind the queue.
2. Provincial portals (Punjab → Sindh → KPK → Balochistan).
3. FBR rate/verification sync.
4. One payment gateway end to end (PayFast), then the wallets.
5. Move the document store to MongoDB and search to Elasticsearch if `jsonb` /
   SQL search is outgrown.
