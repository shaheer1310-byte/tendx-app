# TendX — Project Summary

TendX is a SaaS platform that helps **Pakistani suppliers win government, military,
institutional and private-sector tenders**. It is AI tender, procurement and
compliance intelligence built for the **supplier side**: discover relevant
tenders, check eligibility, generate compliant bid packs, estimate tax/profit,
source cheaper inputs, and manage a team workspace.

- **Live app:** https://tendx-app.vercel.app
- **Repo:** https://github.com/shaheer1310-byte/tendx-app
- **Demo login:** `ali@hassantextiles.pk` / `tendx-demo`
- **Source of truth for scope:** `TendX_App_Build_Spec.md` (build proceeds in the
  phase order of spec section 12). Working notes for day-to-day development live
  in `CLAUDE.md`.

---

## 1. Status — all phases complete

| Phase | Scope | State |
|---|---|---|
| 0 — Scaffolding | Next.js 14 App Router + TS + Tailwind, brand system, app shell, Prisma schema, Auth.js, seed | done |
| 1 — Discovery | Tender feed (search/filter/sort + alerts), tender detail, dashboard (KPIs, AI-matched list, pipeline donut), rule-based matching, manual import | done |
| 2 — Intelligence | AI Analyzer (eligibility / bid pack / profit panels), Bid Generator (editable pack, cert uploads, PDF export), deterministic Tax & Profit calculator, Free/Professional gating | done |
| 3 — Sourcing + mobile | Supplier Hub (search, cost comparison, Professional sourcing/margin planner), React Native (Expo) app in `mobile/` sharing the web API | done |
| 4 — Enterprise | Team workspaces + RBAC, Analytics (custom SVG charts), public REST API (`/api/v1`) with hashed API keys + rate limiting, connector framework (design-only) | done |

---

## 2. Stack

- **Next.js 14** (App Router), **React 18**, **TypeScript (strict)**.
- **Tailwind CSS** with brand design tokens as CSS variables
  (`src/app/globals.css` + `tailwind.config.ts`). Never hardcode hex in
  components — use token classes (`bg-navy`, `text-teal`, etc.).
- **Prisma ORM + PostgreSQL** (Neon in production; pinned to Prisma v6).
- **Auth.js (NextAuth v5)** — email/password credentials, JWT sessions, roles
  `owner | admin | member`.
- **AI behind `src/lib/ai`** — provider toggled by `AI_PROVIDER`
  (`mock` default, `groq`, or `anthropic`).
- **pdf-lib** for bid-pack PDF export. **zod** for server-side input validation.
- **Fonts:** Sora (display) + IBM Plex Sans (body) via `next/font/google`.
- **Mobile:** Expo + expo-router in `mobile/` (separate `package.json`, excluded
  from the web build).

---

## 3. Architecture (important — read before editing)

### 3.1 Data layer is a hybrid: in-memory store + Postgres
- The canonical demo data lives in **`src/server/data/fixtures.ts`** (the single
  source of truth for the section 11 demo dataset). `prisma/seed.ts` seeds
  Postgres from the same fixtures, so DB and runtime never diverge.
- **`src/server/store.ts`** is a process-singleton in-memory store seeded from
  the fixtures. Most runtime reads (tenders, matches, suppliers, analytics,
  team, dashboard KPIs) come from here, so the app runs with **no database**
  locally.
- **Auth and bids are persisted to Postgres when a database is reachable**, with
  the in-memory store as an automatic fallback (so local-with-no-DB still works):
  - **Auth** (`src/lib/auth.ts`, `src/app/api/signup/route.ts`): tries Prisma
    first, falls back to the store. Required in production because serverless
    instances don't share memory.
  - **Bids** (`src/server/bids.ts`): persisted to the `workspace_bids` table
    when a DB is reachable; demo seed bids are provisioned per company on first
    access; in-memory fallback otherwise.
- **Sessions are JWTs**, so once issued they validate on any serverless instance
  with no DB round-trip.

### 3.2 Multi-tenant by `companyId`
- Tenders are a **shared global pool**. Each company gets its **own company
  profile, matches and bids**, lazily cloned from the demo seed.
- The active company is resolved from the **signed Auth.js session**, never a
  client value: `src/server/tenant.ts`
  (`getActiveCompanyId` / `getActiveCompany` / `getActiveMatches`). Falls back to
  the demo company when there is no session.
- Because resolution is session-based (async), these services are **async**:
  `tenders.ts` (`listTenders`/`getTender`/`importTender`), `bids.ts`,
  `dashboard.ts`. Dashboard KPIs, analytics, suppliers and the team list remain
  shared demo data.

### 3.3 AI providers (`src/lib/ai`)
- `AI_PROVIDER=mock` (default) runs with no keys.
- `AI_PROVIDER=groq` + `GROQ_API_KEY` uses free/open-source models via Groq's
  OpenAI-compatible endpoint (`https://api.groq.com/openai/v1`, model `AI_MODEL`,
  default `llama-3.3-70b-versatile`).
- `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` uses real Claude.
- The real providers extend `MockAiService` and override only the generative
  methods (requirement extraction, bid drafting, the one-sentence sourcing
  recommendation). **Eligibility, match score and ALL tax math are deterministic
  and stay in code** (`server/matching.ts`, `server/tax.ts`) — the LLM is never
  in the scoring or money path (Build Spec section 9.5).
- `GroqAiService` falls back to the mock per-call on any failure/rate-limit, and
  entirely when `GROQ_API_KEY` is unset, so the demo never breaks.

### 3.4 Plan gating + RBAC (server-side, section 10)
- `src/server/plan.ts`: plan resolved from a `tendx_plan` cookie (demo switcher
  in Settings) else default `professional`. `isProfessional()` /
  `isEnterprise()` (+ `assertProfessional` / `assertEnterprise`) gate features
  and return 403 / render `UpgradeGate`.
- RBAC (`src/server/auth-context.ts`): the acting user is resolved from a
  `tendx_user` cookie (demo switcher); `hasRole` / `assertRole` (rank
  owner > admin > member) guard team/profile/key/connector mutations.

### 3.5 Public API + connectors
- Versioned public API under `src/app/api/v1/*` (tenders, tender by id, matches),
  authed by **SHA-256-hashed API keys** (`server/apikeys.ts`) with per-key
  in-memory **rate limiting** (`lib/rate-limit.ts`, `lib/public-api.ts`).
- Connector framework in `src/server/connectors/` is **design-only**: every
  connector is `planned` and `sync()` returns HTTP 501. See `docs/connectors.md`
  and `docs/public-api.md`.

---

## 4. Routes

**Authenticated app shell** (`src/app/(app)/layout.tsx` = navy `Sidebar` +
`Topbar`), gated by `src/middleware.ts`:
- `/dashboard`, `/tenders`, `/tenders/[id]`, `/tenders/[id]/analyze`, `/analyze`,
  `/bids`, `/bids/[id]`, `/suppliers`, `/tax`, `/analytics` (Professional),
  `/settings` (Enterprise Team / API / Integrations panels).

**Public:** `/` (landing), `/login`, `/signup`. Logged-out visitors to shell
routes are redirected to `/login`; logged-in visitors on `/login`|`/signup` go to
`/dashboard`.

**Key API routes** (`src/app/api/*`): `tenders`, `tenders/[id]`, `tenders/import`,
`dashboard/summary`, `suppliers`, `suppliers/sourcing/[tenderId]`, `bids` (+
`[id]`, `[id]/generate`, `[id]/export`), `tax/estimate`, `company`, `matches`,
`team` (+ `[id]`), `acting-user`, `plan`, `analytics/summary`, `keys` (+ `[id]`),
`connectors` (+ `[id]/sync`), `signup`, `auth/[...nextauth]`, and the public
`v1/{tenders,tenders/[id],matches}`.

---

## 5. Deployment (all free tiers)

- **GitHub** (free) — source repo, auto-deploys to Vercel on push to `main`.
- **Vercel Hobby** (free) — hosts the Next.js app. Build runs `prisma generate`
  via the `postinstall` script, then `next build`.
- **Neon** (free) — PostgreSQL. `DATABASE_URL` is the **pooled** connection
  (host has `-pooler`, plus `?sslmode=require&pgbouncer=true`) used by the
  serverless app; `DIRECT_URL` is the **direct** connection used for
  migrations/seed.
- **Groq** (free) — `llama-3.3-70b-versatile` for the generative AI.

### 5.1 Environment variables (set in Vercel → Project → Settings → Environment Variables)
| Name | Purpose |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection (`-pooler`, `sslmode=require&pgbouncer=true`) |
| `DIRECT_URL` | Neon **direct** connection (migrations/seed) |
| `AUTH_SECRET` | Auth.js JWT signing secret (`npx auth secret` or 32 random bytes) |
| `AUTH_URL` | Production HTTPS URL, e.g. `https://tendx-app.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |
| `GROQ_API_KEY` | Groq API key (`gsk_...`) |
| `AI_PROVIDER` | `groq` |
| `AI_MODEL` | `llama-3.3-70b-versatile` |

`.env.example` documents these. The real `.env` is gitignored and never
committed.

### 5.2 Database migrations
- Schema: `prisma/schema.prisma`. Migrations: `prisma/migrations/`
  (`0_init`, `1_workspace_bids`).
- Apply to Neon with `DIRECT_URL` set: `npx prisma migrate deploy`.
- Seed the demo data: `npx prisma db seed`.

---

## 6. Local development

```bash
npm install                 # also runs prisma generate (postinstall)
cp .env.example .env        # then fill values (or leave defaults for no-DB/mock)
npm run dev                 # http://localhost:3000
```

- With **no DB and `AI_PROVIDER=mock`**, the app runs entirely on the in-memory
  store with mocked AI — zero external setup. Demo login still works.
- To run against Neon + Groq locally, put the Neon URLs + `GROQ_API_KEY` in
  `.env` and set `AI_PROVIDER=groq` (note: this reads/writes the **production**
  database if you reuse the prod URLs).

Useful scripts: `npm run dev`, `npm run build`, `npm run db:generate`,
`npm run db:push`, `npm run db:migrate`, `npm run db:seed`.

Mobile app: `cd mobile && npm install && npx expo start` (point it at the web API
via `EXPO_PUBLIC_API_URL`; see `mobile/README.md`).

---

## 7. Known limitations & free-tier notes

- **Serverless in-memory caveat:** accounts and **bids** persist in Neon, but
  per-company **profile edits and matches** live in the in-memory store and reset
  on a serverless cold start. The dashboard always looks populated regardless
  (it reads deterministic seed clones). Tenders, KPIs, analytics, suppliers and
  the team list are shared demo data.
- **Vercel Hobby:** non-commercial use only (ToS); functions time out at 10s
  (a Groq analyze runs ~4s; the mock fallback is instant); ~100 GB bandwidth/mo.
- **Neon Free:** 0.5 GB storage; compute auto-suspends after ~5 min idle, so the
  first request after idle can be ~1s slower while it wakes; ~190 compute-h/mo.
- **Groq Free:** rate-limited (roughly ~30 req/min and a daily cap on this
  model). On limit the app auto-falls back to the mock, so it never hard-breaks.

---

## 8. Repository layout (high level)

```
src/
  app/
    (app)/            # authenticated shell + pages (dashboard, tenders, bids, ...)
    (auth)/           # login, signup
    api/              # route handlers (REST) incl. public v1/*
    onboarding/, page.tsx (landing), layout.tsx, globals.css
  components/         # UI by feature (dashboard, tenders, bids, analytics, team, ...)
  lib/
    ai/               # mock | groq | anthropic providers (single interface)
    auth.ts, auth.config.ts, auth-edge.ts   # Auth.js (split for edge middleware)
    prisma.ts, public-api.ts, rate-limit.ts, api-errors.ts, utils.ts
  server/
    store.ts          # in-memory singleton + auth accounts + per-company helpers
    tenant.ts         # active-company resolution from the session
    data/fixtures.ts  # canonical demo data (single source of truth)
    tenders.ts, bids.ts, dashboard.ts, matching.ts, tax.ts, suppliers.ts,
    analytics.ts, team.ts, apikeys.ts, plan.ts, auth-context.ts, analyzer.ts,
    connectors/       # design-only connector registry
    types.ts
  middleware.ts       # route protection
  types/next-auth.d.ts
prisma/               # schema.prisma, migrations/, seed.ts
mobile/               # Expo React Native app (separate package)
docs/                 # connectors.md, public-api.md
CLAUDE.md             # working notes for contributors / AI agents
TendX_App_Build_Spec.md  # full product spec (scope source of truth)
```
