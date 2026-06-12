# TendX — working notes for Claude Code

TendX is a SaaS platform helping Pakistani suppliers win government, military,
institutional and private-sector tenders. AI tender, procurement and compliance
intelligence for the **supplier side**. Source of truth: `TendX_App_Build_Spec.md`
(read it before non-trivial work). Build in the phase order of spec section 12.

## Status
- **Phase 0 (Scaffolding): done.** Next.js 14 App Router + TS + Tailwind, brand
  system, app shell, marketing landing, Prisma schema, Auth.js, seed script.
- **Phase 1 (Discovery): done.** Tender Feed with search/filters/sort + alert
  toggle, tender detail, dashboard (KPIs, AI-matched list, pipeline donut),
  rule-based matching, and a manual "import tender by paste/URL" path.
- **Phase 2 (Intelligence): done.** AI Analyzer (`/tenders/[id]/analyze`) with
  the 3 panels; Bid Generator (`/bids`, `/bids/[id]`) with AI-drafted editable
  pack, certificate upload slots and PDF export (`pdf-lib`); deterministic Tax &
  Profit calculator (`/tax`); server-side Free/Professional plan gating.
- **Phase 3 (Sourcing + mobile): done.** Supplier Hub (`/suppliers`): search /
  cost comparison (`searchSuppliers`, open) + a Professional-gated sourcing panel
  (`sourcingPlan`) that finds the cheapest cheaper offer per BOQ line and
  quantifies the margin lift by running `server/tax.ts` before/after (LLM only
  phrases the sentence, §9.5/§9.6). The analyzer's Panel-3 sourcing now comes
  from `sourcingPlan` too. React Native (Expo + expo-router) app scaffolded in
  `mobile/` (own `package.json`, excluded from the web tsconfig) sharing the same
  API (`/api/tenders`, `/api/dashboard/summary`) — Home + Tenders + tab bar.
- **Phase 4 (Enterprise): done.** Team workspaces + RBAC (`server/team.ts`,
  `server/auth-context.ts`: owner/admin/member, `tendx_user` acting-as cookie);
  Analytics (`/analytics`, Professional, custom-SVG charts from
  `server/analytics.ts`); the §8 API surface completed (`/api/matches`,
  `/api/company`) plus a versioned public API (`/api/v1/{tenders,tenders/[id],
  matches}`) authed by hashed API keys (`server/apikeys.ts`) with per-key rate
  limiting (`lib/rate-limit.ts`); and a connector framework
  (`server/connectors/`) for EPADS/PPRA, provincial portals, FBR and payment
  gateways — DESIGN ONLY (all `planned`, `sync()` → 501; see `docs/connectors.md`
  and `docs/public-api.md`).

## AI providers (lib/ai)
- `AI_PROVIDER=mock` (default) runs with no keys. `AI_PROVIDER=groq` +
  `GROQ_API_KEY` uses free/open-source models via Groq's OpenAI-compatible
  endpoint (`https://api.groq.com/openai/v1`, model `AI_MODEL`, default
  `llama-3.3-70b-versatile`) through the `openai` SDK; `AI_PROVIDER=anthropic` +
  `ANTHROPIC_API_KEY` uses real Claude (`ANTHROPIC_MODEL`, default
  `claude-opus-4-8`). Both are used for extraction, bid drafting and the sourcing
  sentence only. `GroqAiService`/`AnthropicAiService` extend `MockAiService`, so
  eligibility, match score and ALL tax math stay deterministic
  (`server/matching.ts`, `server/tax.ts`) — the LLM is never in the scoring or
  money path (Build Spec §9.5). `GroqAiService` falls back to the mock per-call
  on any failure/rate-limit, and entirely when `GROQ_API_KEY` is unset, so the
  demo never breaks.

## Plan gating (server-side, §10)
- `server/plan.ts` resolves the plan from a `tendx_plan` cookie (demo switcher
  in Settings, `POST /api/plan`) else the company's plan. `isProfessional()` /
  `assertProfessional()` guard the analyzer, bid, and tax endpoints (return 403)
  and the matching pages render `UpgradeGate`. Discovery (feed/search) is open,
  as is supplier search; the sourcing/margin endpoint is Professional-gated.
- `isEnterprise()` / `assertEnterprise()` gate the Phase 4 Enterprise features
  (team, API keys, connectors) → 403 / Enterprise `UpgradeGate`. RBAC adds a
  second axis: `server/auth-context.ts` resolves the acting user from a
  `tendx_user` cookie (demo switcher, `POST /api/acting-user`) and
  `assertRole("admin")` guards team/profile/key/connector mutations.
- Real billing replaces the `tendx_plan` cookie later (connector design wires
  the gateways; see `docs/connectors.md`).

## Data layer (Phase 1)
- Runtime data is served from an in-memory store (`src/server/store.ts`) seeded
  from the canonical fixtures in `src/server/data/fixtures.ts`. This is the
  SINGLE SOURCE OF TRUTH for the §11 demo data; `prisma/seed.ts` imports the
  same fixtures, so the DB and runtime never diverge. The store is a process
  singleton — imported tenders and signups persist until the server restarts.
- AUTH ALSO RUNS ON THE STORE (no DB needed). `store.accounts` holds bcrypt-hashed
  identities; the demo login `ali@hassantextiles.pk` / `tendx-demo` is seeded.
  `createAccount()` (signup) makes a new account + companyId and provisions its
  demo dataset. MULTI-TENANT by companyId: tenders are a shared global pool, but
  each company gets its OWN company profile, matches and bids — lazily cloned
  from the demo seed (`ensureCompany`, `ensureCompanyMatches`, `ensureCompanyBids`
  over `companiesByCompany`/`matchesByCompany`/`bidsByCompany`). So a new signup
  sees the full demo (§11) while profile edits / new bids stay that account's own
  (verified: one account editing its profile does not change another's). Dashboard
  KPIs, analytics, suppliers and the team list remain shared demo data.
  `server/tenant.ts` resolves the active company from the SIGNED Auth.js session
  (`getActiveCompanyId/getActiveCompany/getActiveMatches`, never a client value;
  falls back to the demo company). Because of this, `tenders.ts` (listTenders/
  getTender/importTender), `bids.ts`, `dashboard.ts#getDashboardSummary/getCompany`
  and the matching API routes are ASYNC. `plan.ts#getPlan` no longer reads the
  company (cookie `tendx_plan` else default "professional").
- Matching is rule-based in `src/server/matching.ts` (PPRA, turnover, category
  overlap, certs). Imported tenders run mock-AI extraction then this matcher.
- Server services: `src/server/{tenders,dashboard,suppliers}.ts`. API routes
  mirror §8: `GET /api/tenders`, `GET /api/tenders/[id]`,
  `POST /api/tenders/import`, `GET /api/dashboard/summary`,
  `GET /api/suppliers`, `GET /api/suppliers/sourcing/[tenderId]`.
- Supplier Hub data (`seedSuppliers`, `seedOffers`, `seedBoqs`) also lives in
  `fixtures.ts` and seeds the store (not in the Prisma schema yet — Phase 4).
- Phase 4 also seeds `seedUsers` (team) and `seedApiKeys` (display-only) into the
  store, plus `analyticsStats`. Extra Phase-4 services: `server/{team,analytics,
  apikeys}.ts` and the static `server/connectors/` registry. Extra API routes:
  `/api/team[/[id]]`, `/api/acting-user`, `/api/analytics/summary`, `/api/matches`,
  `/api/company`, `/api/keys[/[id]]`, `/api/connectors[/[id]/sync]`, and the
  public `/api/v1/*`. NOTE: adding a store field (e.g. `users`, `apiKeys`)
  requires a dev-server restart — the `globalThis` store singleton survives HMR,
  so a stale object 500s until reseeded.
- When switching to Postgres: keep `fixtures.ts` as the source, point the
  services at Prisma, and run `db:push` + `db:seed`.

## Stack (MVP)
- Next.js 14 App Router, React 18, TypeScript (strict).
- Tailwind CSS with design tokens as CSS variables (`src/app/globals.css` +
  `tailwind.config.ts`).
- Fonts: Sora (display/headings), IBM Plex Sans (body) via `next/font/google`.
- Prisma ORM + PostgreSQL (pinned to Prisma v6; v7 needs driver adapters).
- Auth.js (NextAuth v5) — credentials, JWT sessions, roles owner/member/admin.
  Split config: `lib/auth.config.ts` (edge-safe, used by `src/middleware.ts` via
  `lib/auth-edge.ts`) + `lib/auth.ts` (Credentials provider against `store`).
- All AI behind `src/lib/ai` with a mock provider toggled by `AI_PROVIDER`
  (defaults to `mock`, so the app runs with no API keys).

## Brand tokens (spec section 4.1) — never hardcode hex in components
navy `#0A2540` · navy2 `#0F3056` · navy3 `#103A66` · ink `#0B1B2B` ·
teal `#12B5A5` · teal2 `#0E9E90` · mint `#2BD9C0` · gold `#F5B82E` ·
gold2 `#FFD36B` · slate `#64768A` · line `#E7EDF3` · bg `#F4F7FA` ·
cloud `#EAF1F8` · white `#FFFFFF` · green `#1FA971` · red `#E5484D`.
Use Tailwind classes (`bg-navy`, `text-teal`, `bg-navy-hero`, etc.).

## Layout / routes
- Authenticated shell: `src/app/(app)/layout.tsx` = `Sidebar` + `Topbar`.
  Routes: `/dashboard`, `/tenders`, `/analyze` (per-tender analyzer lives at
  `/tenders/[id]/analyze`), `/bids`, `/suppliers`, `/tax`, `/analytics`
  (Professional), `/settings` (Enterprise Team/API/Integrations panels live here).
- Unauthenticated: `/` landing, `(auth)/login`, `(auth)/signup`, `/onboarding`.
- The `(app)` routes are gated by `src/middleware.ts`: logged-out visitors are
  redirected to `/login`, and logged-in visitors on `/login`|`/signup` go to
  `/dashboard`. Only `/`, `/login` and `/signup` are public. The whole app is
  navigable by clicking the sidebar `<Link>`s (active item via `aria-current`).

## Conventions (spec section 13)
- TypeScript strict; no `any` without justification.
- Feature-first folders: `app/`, `components/`, `lib/`, `server/`, `prisma/`.
- All colors/spacing from tokens; zod-validate every API input server-side.
- Every AI call goes through `lib/ai` (mock toggled by env).
- Secrets in env only; `.env` is gitignored, `.env.example` is committed.
- Prose: no em/en dashes; hyphens only inside compound words.

## Commands
- `npm run dev` — start the app at http://localhost:3000.
- `npm run db:generate` — regenerate Prisma client after schema edits.
- `npm run db:push` — push schema to a live Postgres (needs `DATABASE_URL`).
- `npm run db:seed` — load demo data. Login: `ali@hassantextiles.pk` / `tendx-demo`.
- Mobile app (`mobile/`, Expo + expo-router): `cd mobile && npm install &&
  npx expo start`. Point it at the web API via `EXPO_PUBLIC_API_URL` (see
  `mobile/.env.example` and `mobile/README.md`). Keep `mobile/` out of the web
  build (already excluded in `tsconfig.json`).
