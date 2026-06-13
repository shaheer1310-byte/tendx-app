# TendX — Handoff Guide for Another AI / Developer

This file explains how to pick up the TendX codebase and safely make changes or
add features with a different AI assistant (Claude, or any coding agent) or a new
human developer. Read this together with `PROJECT_SUMMARY.md` and `CLAUDE.md`.

---

## 1. First things to read (in order)

1. **`CLAUDE.md`** — concise working notes: status, conventions, architecture
   decisions, gotchas. This is the most important file for an agent.
2. **`PROJECT_SUMMARY.md`** — full overview of what the app is and how it's built
   and deployed.
3. **`TendX_App_Build_Spec.md`** — the product spec and source of truth for
   scope. Section numbers (e.g. "section 9.5", "section 12") are referenced
   throughout the code comments.
4. **`docs/public-api.md`** and **`docs/connectors.md`** — for the public API and
   the (design-only) connector framework.

---

## 2. How to hand this to another AI — copy/paste starter prompt

> You are working on **TendX**, a Next.js 14 (App Router) + TypeScript SaaS that
> helps Pakistani suppliers win tenders. Before doing anything, read `CLAUDE.md`,
> `PROJECT_SUMMARY.md`, and `AI_HANDOFF.md` in the repo root, then
> `TendX_App_Build_Spec.md` for scope. Follow these hard rules:
> - TypeScript strict; no `any` without justification.
> - Never hardcode hex colors in components — use the Tailwind brand tokens.
> - Validate every API input server-side with zod.
> - All AI calls go through `src/lib/ai` (mock provider by default). The LLM must
>   NEVER compute eligibility, match scores, or any tax/money figure — those are
>   deterministic in `server/matching.ts` and `server/tax.ts` (spec 9.5).
> - Enforce plan/role gating server-side (`server/plan.ts`,
>   `server/auth-context.ts`).
> - Prose in code/docs uses hyphens only (no em or en dashes).
> - The data layer is a hybrid: in-memory store (`server/store.ts`) for demo
>   content + Postgres for auth and bids. The active company comes from the
>   signed session via `server/tenant.ts`, never a client value.
> Tell me your plan before large changes, run `npx tsc --noEmit` after edits, and
> verify locally before deploying.

Give the agent the repo (GitHub URL or a zip) plus the environment variable
**names** (not the secret values — see Security below).

---

## 3. Get it running locally

```bash
git clone https://github.com/shaheer1310-byte/tendx-app.git
cd tendx-app
npm install            # postinstall runs `prisma generate`
cp .env.example .env   # defaults are fine for a no-DB, mocked-AI run
npm run dev            # http://localhost:3000
```

- **Zero-setup mode:** leave `.env` defaults (`AI_PROVIDER=mock`, the localhost
  `DATABASE_URL` placeholder). The app runs fully on the in-memory store with
  mocked AI. Demo login: `ali@hassantextiles.pk` / `tendx-demo`.
- **Against real services:** put the Neon URLs + `GROQ_API_KEY` in `.env` and set
  `AI_PROVIDER=groq`. ⚠️ Reusing the production Neon URLs locally reads/writes the
  **live** database — use a separate Neon branch/DB for development if you don't
  want that.

After any code change: `npx tsc --noEmit` (the project type-checks clean).

---

## 4. Conventions & guardrails (do not break these)

- **Brand tokens only** — colors/spacing come from CSS variables in
  `globals.css` + `tailwind.config.ts` (`bg-navy`, `text-teal`, `bg-bg`, ...).
- **zod-validate every API input** server-side; map errors with
  `lib/api-errors.ts` where applicable.
- **AI behind `lib/ai`** — add new AI features to the `AiService` interface in
  `lib/ai/types.ts` and implement in `mock.ts` (always) + `groq.ts` / `anthropic.ts`.
  Real providers extend the mock and only override generative methods.
- **Money/score path stays deterministic** — `server/tax.ts` and
  `server/matching.ts` are pure functions; never route their outputs through the
  LLM.
- **Server-side gating** — Professional/Enterprise via `server/plan.ts`; roles via
  `server/auth-context.ts`. API routes return 403; pages render `UpgradeGate`.
- **No em/en dashes** in prose; hyphens only.

---

## 5. Architecture gotchas (the stuff that bites)

1. **The in-memory store is a `globalThis` singleton that survives HMR.** If you
   add a field to the `Store` interface in `server/store.ts`, a running dev server
   keeps the stale object and will 500 until you **restart `npm run dev`**.
2. **Serverless has no shared memory.** On Vercel, each route is its own function
   with its own in-memory store. Anything that must survive across requests/
   instances (auth, generated bids) **must be persisted to Postgres**, not the
   store. This is exactly why `auth` and `bids` use the Prisma-first / store-
   fallback pattern. If you add user-generated, must-persist data, follow that
   same pattern (see `server/bids.ts` for the template) and add a migration.
3. **Company-scoped services are async.** `listTenders`, `getTender`,
   `importTender` (`server/tenders.ts`), all of `server/bids.ts`, and
   `getDashboardSummary`/`getCompany` (`server/dashboard.ts`) resolve the active
   company from the session and are therefore `async` — `await` them in pages and
   route handlers.
4. **`getPlan()` defaults to `professional`** (cookie `tendx_plan` overrides). It
   does not read the company row, so new signups see the full demo. Don't
   reintroduce a DB read there without making it async-safe.
5. **Auth is split for edge:** `lib/auth.config.ts` (edge-safe, used by
   `middleware.ts` via `lib/auth-edge.ts`) + `lib/auth.ts` (Credentials provider,
   Node-only — Prisma/bcrypt). Keep Prisma/bcrypt out of `auth.config.ts`.
6. **Fixtures are the single source of truth** (`server/data/fixtures.ts`). Both
   the store and `prisma/seed.ts` consume them — change demo data there only.

---

## 6. How to add a feature (typical flow)

1. Check the spec (`TendX_App_Build_Spec.md`) for intended behavior and the phase
   it belongs to. Update `CLAUDE.md` status notes when done.
2. Add/extend types in `src/server/types.ts` (and `lib/ai/types.ts` for AI).
3. Implement server logic in `src/server/*` (pure/deterministic where it touches
   money or scoring). Resolve tenancy via `server/tenant.ts` if company-scoped.
4. Add a route handler in `src/app/api/*` with zod validation + gating.
5. Build the UI in `src/components/*` (tokens only) and wire a page under
   `src/app/(app)/*`.
6. If it needs persistence on serverless: add a Prisma model + migration and use
   the Prisma-first / in-memory-fallback pattern.
7. `npx tsc --noEmit`, run locally, verify, then deploy (section 7).

---

## 7. How to deploy changes

The repo is connected to Vercel and **auto-deploys on push to `main`**.

```bash
git add -A
git commit -m "..."
git push origin main          # Vercel builds & deploys automatically
```

- If you changed `prisma/schema.prisma`, create and apply a migration to Neon
  **before/at deploy** so the new code finds the schema:
  ```bash
  # generate a migration from the current DB to the schema (no shadow DB needed)
  npx prisma migrate diff --from-url "$DIRECT_URL" \
    --to-schema-datamodel prisma/schema.prisma --script \
    > prisma/migrations/<n>_<name>/migration.sql
  npx prisma migrate deploy          # applies with DIRECT_URL
  ```
  Commit the migration folder. Vercel's build runs `prisma generate` (postinstall)
  so the client picks up new models; it does **not** run migrations for you.
- Env var changes are made in **Vercel → Project → Settings → Environment
  Variables**, then redeploy. See the table in `PROJECT_SUMMARY.md`.
- After deploy, verify the live URL (e.g. signup → login → dashboard → one AI
  analyze).

---

## 8. Security / secrets — important for handoff

- **Never commit `.env`** (it is gitignored). Only `.env.example` (placeholders)
  is in the repo. These handoff docs use placeholders too.
- The real secret **values** (Neon password, `AUTH_SECRET`, `GROQ_API_KEY`) live
  only in your local `.env` and in Vercel's encrypted env vars. Share them with a
  new developer/AI through a secure channel, not in the repo or chat history.
- **If secrets were ever pasted into a shared chat, rotate them:** regenerate the
  Groq key (console.groq.com), reset the Neon password (Neon dashboard), and
  generate a new `AUTH_SECRET` (`npx auth secret`) — then update `.env` and
  Vercel. Rotating `AUTH_SECRET` logs everyone out (expected).
- An AI agent does not need the secret values to work on the code — give it the
  variable **names** and let it run in mocked / no-DB mode locally.

---

## 9. Quick reference

| Thing | Where |
|---|---|
| Live app | https://tendx-app.vercel.app |
| Repo | https://github.com/shaheer1310-byte/tendx-app |
| Demo login | `ali@hassantextiles.pk` / `tendx-demo` |
| Product spec | `TendX_App_Build_Spec.md` |
| Working notes | `CLAUDE.md` |
| Demo data | `src/server/data/fixtures.ts` |
| AI providers | `src/lib/ai/` |
| Tenancy resolution | `src/server/tenant.ts` |
| Auth | `src/lib/auth.ts`, `auth.config.ts`, `auth-edge.ts` |
| DB schema / migrations | `prisma/schema.prisma`, `prisma/migrations/` |
| Hosting | Vercel (Hobby) + Neon (Free) + Groq (Free) |
