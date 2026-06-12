# TendX, Application Build Specification

> Hand this file to Claude Code as the source of truth for building the TendX web application (and later the mobile app). It captures the product, brand system, screen designs, data model, AI features, and a phased build plan, all derived from the approved pitch deck, business plan, technical documentation, and high-fidelity UI mockups produced for this project.

---

## 0. How to use this document

1. Place this file at the root of a new empty repository (you may also copy the "Coding conventions" and "Brand and design system" sections into a `CLAUDE.md` so they stay in context every session).
2. Build in the phase order in section 12. Do not attempt everything at once.
3. Treat section 4 (Brand and design system) and section 6 (Screens) as pixel-level intent. The mockups they describe are the agreed look and feel.
4. Where a third-party service is needed (AI, email, payments), stub it behind an interface first so the app runs end to end, then wire the real provider.

---

## 1. Product overview

**Name:** TendX
**Tagline:** From Tender Discovery to Contract Success.
**One-liner:** AI-Powered Tender, Procurement and Compliance Intelligence for Pakistan.

**What it is:** A SaaS platform that helps Pakistani suppliers win government, military, institutional and private-sector tenders. It is the intelligence layer for the **supplier side** of procurement. It does not replace the government buyer portals (PPRA / EPADS); it sits on top of public tender data and helps suppliers decide what to bid on, prepare compliant bids, source inputs, and price profitably.

**Problem being solved:** Around 200,000 tenders are published in Pakistan every year across 14+ fragmented portals, aggregators and newspapers, and only about 40 percent are formally disclosed. Suppliers miss opportunities, spend days preparing bids by hand, and calculate taxes and margins manually. The government EPADS system digitises the buyer side only.

**Primary user (persona):** A business-development or bid manager at a Pakistani supplier company (SME to mid-size) across sectors like construction, defence textiles, medical equipment, IT, and general goods.

---

## 2. Core modules (the product surface)

The product is organised into five modules. These map directly to the left-hand navigation in the app.

1. **Tender Intelligence Engine** (Tender Feed): aggregates tenders from many sources into one searchable feed with filters, deadline tracking, saved searches, and alerts.
2. **AI Tender Analyzer**: opens a single tender, extracts its requirements, runs an eligibility check against the company profile, produces a match score, and recommends actions.
3. **Bid Generation System** (Bid Generator): drafts the bid pack (cover letter, technical proposal, financial bid / BOQ, compliance checklist) and tracks document readiness.
4. **Procurement Intelligence** (Supplier Hub): supplier discovery, cost comparison, and import-sourcing suggestions to reduce input cost for a bid.
5. **Tax and Compliance Intelligence** (Tax and Profit): auto-calculates GST, SST, withholding tax and duties, and shows estimated net profit and margin before committing to a bid.

---

## 3. Recommended tech stack

### MVP stack (build this first)
- **Language:** TypeScript everywhere.
- **Web framework:** Next.js 14+ (App Router) with React 18.
- **Styling:** Tailwind CSS, with the design tokens in section 4 wired into `tailwind.config.ts`. Use CSS variables for the palette.
- **UI primitives:** Headless components (Radix UI) or shadcn/ui; keep components in `components/ui`. Charts via Recharts.
- **Fonts:** Sora (display and headings), IBM Plex Sans (body). Load via `next/font/google`.
- **Auth:** Auth.js (NextAuth) with email plus password and JWT sessions, role-based access (RBAC) with roles `owner`, `member`, `admin`.
- **Database:** PostgreSQL via Prisma ORM. Use `pgvector` for embeddings. Store parsed-tender JSON and generated-bid JSON as `jsonb` columns in MVP (the document-store collections in section 7.2 can map to `jsonb` first, and move to MongoDB later if needed).
- **AI provider:** Anthropic Claude API for requirement extraction, bid drafting, and match-score explanations. Wrap all AI calls behind a single `lib/ai` service interface so the provider can be swapped or mocked.
- **Embeddings and matching:** an embeddings model plus `pgvector` cosine similarity for tender-to-company matching in MVP.
- **File storage:** S3-compatible bucket (store BOQ PDFs, certificates, generated bid documents). Use signed URLs.
- **Background jobs:** a queue (e.g. BullMQ on Redis) for tender ingestion and AI generation so requests do not block.
- **Hosting target:** Vercel for the web app, a managed Postgres (Neon or Supabase), and Redis (Upstash). Keep everything env-driven.

### Scale-up path (do not build yet, design for it)
- Split a dedicated Node API (REST + GraphQL gateway) with JWT/RBAC and rate limiting.
- MongoDB for the tender-document and generated-bid stores.
- Elasticsearch for full-text tender search; a dedicated vector store if `pgvector` is outgrown.
- React Native mobile app sharing the same API (see section 6.9 for the mobile design).
- Connectors service that ingests EPADS/PPRA, provincial portals, FBR tax data, and payment gateways.

---

## 4. Brand and design system

> This is the agreed visual identity. Match it exactly.

### 4.1 Color tokens
Wire these as CSS variables and Tailwind colors.

| Token | Hex | Use |
|---|---|---|
| navy | `#0A2540` | primary brand, sidebar, dark sections |
| navy2 | `#0F3056` | gradient partner for navy |
| navy3 | `#103A66` | gradient partner, lighter navy |
| ink | `#0B1B2B` | primary text on light |
| teal | `#12B5A5` | primary accent, active states, primary buttons |
| teal2 | `#0E9E90` | teal gradient partner, secondary accent text |
| mint | `#2BD9C0` | bright accent, highlights on dark |
| gold | `#F5B82E` | the "X", CTAs, the highlight color |
| gold2 | `#FFD36B` | gold gradient partner |
| slate | `#64768A` | secondary / muted text |
| line | `#E7EDF3` | borders and dividers |
| bg | `#F4F7FA` | app background (light) |
| cloud | `#EAF1F8` | alternate light band / icon chips |
| white | `#FFFFFF` | cards |
| green | `#1FA971` | success, high match score |
| red | `#E5484D` | alerts, notification dot |

Gradients used: navy hero `linear-gradient(160deg, navy 0%, navy2 55%, navy3 100%)`; teal accents `linear-gradient(90deg, teal, teal2)`; gold `linear-gradient(..., gold, gold2)`.

### 4.2 Typography
- **Display / headings:** Sora, weights 700 and 800, slightly negative letter-spacing on large sizes.
- **Body / UI:** IBM Plex Sans, weights 400 to 600.
- Type scale (web app baseline): page title 25px/700, section heading 16px/700, KPI number 34px/800, body 14px, small / meta 12 to 12.5px, uppercase labels 12.5px with letter-spacing.
- Buttons and numeric stats use Sora; running text uses IBM Plex Sans.

### 4.3 Logo
The mark is a navy rounded-square badge containing a two-tone "X": a teal stroke crossed by a gold growth-arrow that ends in an arrowhead, plus a small mint "AI spark" dot. The wordmark is "TendX" with the **X in gold**. Subtitle lockup reads "Tender · Procurement · Compliance AI".

Reusable SVG for the mark (drop into a `Logo` component):

```html
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0A2540"/><stop offset="1" stop-color="#103A66"/>
    </linearGradient>
    <linearGradient id="tG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2BD9C0"/><stop offset="1" stop-color="#12B5A5"/>
    </linearGradient>
    <linearGradient id="gG" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#F5B82E"/><stop offset="1" stop-color="#FFD36B"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="120" fill="url(#bgG)"/>
  <line x1="168" y1="160" x2="344" y2="352" stroke="url(#tG)" stroke-width="62" stroke-linecap="round"/>
  <line x1="168" y1="352" x2="330" y2="186" stroke="url(#gG)" stroke-width="62" stroke-linecap="round"/>
  <path d="M306 150 L378 142 L362 212 Z" fill="url(#gG)" stroke="url(#gG)" stroke-width="10" stroke-linejoin="round"/>
  <circle cx="384" cy="356" r="15" fill="#2BD9C0"/>
  <circle cx="384" cy="356" r="30" fill="none" stroke="#2BD9C0" stroke-width="6" opacity="0.45"/>
</svg>
```

### 4.4 UI conventions
- Cards: white, 1px `line` border, 16px radius, soft navy shadow at low opacity.
- Sidebar: navy, white text, active item is a teal gradient pill.
- Icon chips: small rounded squares filled with `cloud`, teal icon inside.
- Match-score chips: high (>= 85%) green on light-green; medium (70 to 84%) gold/brown on light-gold; low (< 70%) slate on light.
- Rounded corners throughout (10 to 16px), generous padding, plenty of whitespace.
- Prose rule for all user-facing copy and docs: no em dashes or en dashes; use hyphens only inside compound words.

---

## 5. Information architecture and navigation

Authenticated app shell = left **sidebar** + top bar + content area.

Sidebar nav (in order), each is a route:
1. Dashboard `/dashboard`
2. Tender Feed `/tenders`
3. AI Analyzer `/tenders/[id]/analyze`
4. Bid Generator `/bids` (and `/bids/[id]`)
5. Supplier Hub `/suppliers`
6. Tax and Profit `/tax`
7. Settings `/settings`

Below the nav: a plan-upgrade card ("Professional Plan, Unlock AI matching, bid generation and profit analytics", Upgrade button) shown to Free users.

Top bar: global search ("Search tenders, suppliers, categories..."), a notifications bell with an unread dot, and a user avatar (initials).

Unauthenticated routes: `/` marketing landing, `/login`, `/signup`, `/onboarding` (company profile setup).

---

## 6. Screens (detailed)

### 6.1 Dashboard `/dashboard`
Two-column content under a greeting.
- Greeting: "Good morning, {firstName}" + subline "You have {n} newly matched tenders and {m} deadlines this week."
- **KPI row, 4 cards:** Matched Tenders (e.g. 38, "▲ 12 this week"), Active Bids (9, "4 in progress"), Deadlines / 7 days (3, "On track"), Avg Match Score (87%, "▲ 5% vs last month"). The last card uses the navy gradient background with mint trend text.
- **AI-Matched Tenders** card (wider, ~1.55fr): a list of tender rows, each with an icon chip, title, meta line ("{sector} · PKR {value} · {city}"), a match-score chip, and a deadline ("{n} days" + date). Header has a "View all" link to `/tenders`.
- **Bid Pipeline** card (~1fr): a donut showing win-readiness (e.g. 68% "Win-ready") with legend: Bid-ready and compliant 68% (teal), Missing documents 18% (gold), Under review 14% (line/grey).

### 6.2 Tender Feed `/tenders`
- Search + filter bar: keyword, sector/category, province/city, buyer type (federal, provincial, military, SOE, private), value range, deadline window, source portal.
- Result list or table of tenders: title, buyer, sector, value, location, published date, closing date, source, and a match score for the logged-in company. Sort by match score, deadline, value, recency.
- Saved searches and an alert toggle ("notify me of new matches").
- Row click opens the tender detail / analyzer.

### 6.3 AI Tender Analyzer `/tenders/[id]/analyze`
This is the flagship screen. Layout: a tender header, a big match score, then three analysis panels.
- **Header:** tender title (e.g. "Supply and Stitching of Security Uniforms, Sindh Rangers HQ"), ref number, category, value, close date.
- **AI Match Score:** large percentage (e.g. 92%) with a label ("STRONG FIT").
- **Panel 1, Eligibility Check:** a checklist of criteria, each marked pass (check), fail (cross), or warning. Examples: "Active PPRA / EPADS registration, verified" (pass); "Turnover >= PKR 15M over 3 yrs, your avg PKR 31M" (pass); "Category experience (textiles), 5 similar contracts" (pass); "ISO 9001 quality certificate, not on file, required" (fail); "Earnest money 2% (PKR 480K), pay order pending upload" (warning).
- **Panel 2, Documents and Bid Pack:** list of bid documents with status badges: Technical Proposal (AI-GENERATED), Cover Letter (AI-GENERATED), Financial Bid / BOQ (DRAFTED), Compliance Checklist (READY), ISO 9001 Certificate (MISSING). An AI insight line, for example "Add the ISO 9001 certificate to raise your match score to 98% and meet all mandatory criteria." Buttons: "Generate Bid Pack" and "Export PDF".
- **Panel 3, Profitability and Tax:** a cost breakdown table: Contract value (PKR 24,000,000), Estimated procurement cost (PKR 17,400,000), GST (18%) on inputs (minus 1,260,000), Withholding tax (4.5%) (minus 1,080,000), Logistics and overheads (minus 720,000), then **Estimated Net Profit** (PKR 3.54M, 14.8% margin). A recommendation line, for example "Source lining fabric from a local Faisalabad supplier to cut input cost about 6% and lift margin to 19%."

### 6.4 Bid Generator `/bids` and `/bids/[id]`
- `/bids`: list of bids in progress with status (Drafted, Win-ready, Missing documents, Under review, Submitted), linked tender, deadline.
- `/bids/[id]`: the editable bid pack. Sections for cover letter, technical proposal, financial bid (BOQ table), and a compliance checklist. AI-generated sections are editable rich text; show which are AI-generated. Document upload slots for required certificates. Export to PDF.

### 6.5 Supplier Hub `/suppliers`
- Search suppliers by item/category and origin (local, import). Compare unit costs. For a given tender's BOQ, suggest cheaper sourcing options and show the margin impact (ties into the Tax and Profit calculation).

### 6.6 Tax and Profit `/tax`
- A standalone calculator mirroring Panel 3: enter contract value and estimated costs, choose applicable taxes (GST 18%, SST, withholding 4.5%, duties), get net profit and margin. Save scenarios against a tender.

### 6.7 Settings `/settings`
- Company profile (legal name, NTN, GST registration, PPRA/EPADS registration status, turnover by year, certifications on file, category experience). This profile feeds eligibility checks and matching.
- Team members and roles. Billing and plan. Notification preferences.

### 6.8 Onboarding `/onboarding`
- Capture the company profile above so matching and eligibility work from day one. Multi-step form.

### 6.9 Mobile app (later phase)
React Native, same API. Home screen: "Welcome back, {firstName}", "{n} new tenders match you", a high-match alert banner ("Security Uniforms, Rangers HQ · 92% fit"), and a "Matched for you" list (sector tag, match %, title, value, city, days left) with "See all". Bottom tab bar.

---

## 7. Data model

### 7.1 Relational (PostgreSQL via Prisma)
Tables and key fields (expand types as needed):

- **users**: `user_id` (uuid, PK), `company_id` (FK), `name`, `email`, `role` (enum: owner, member, admin), `password_hash`, timestamps.
- **companies**: `company_id` (uuid, PK), `legal_name`, `ntn`, `gst_reg`, `ppra_reg_status`, `turnover_by_year` (jsonb), `certifications` (jsonb), `category_experience` (jsonb), `city`, `province`.
- **subscriptions**: `sub_id` (uuid, PK), `company_id` (FK), `plan` (enum: free, professional, enterprise), `status`, `current_period_end`, billing refs.
- **tenders**: `tender_id` (uuid, PK), `source_portal`, `title`, `buyer`, `sector`, `category`, `value_pkr`, `city`, `province`, `buyer_type` (enum), `published_at`, `closes_at`, `ref_no`, `doc_ref` (link to tender_documents), `raw_url`.
- **tender_matches**: `match_id` (uuid, PK), `tender_id` (FK), `company_id` (FK), `score` (numeric), `eligibility` (jsonb: array of {criterion, status, detail}), `created_at`.
- **bids**: `bid_id` (uuid, PK), `match_id` (FK), `company_id` (FK), `status` (enum: drafted, win_ready, missing_docs, under_review, submitted), `created_at`, `submitted_at`.
- **bid_documents**: `document_id` (uuid, PK), `bid_id` (FK), `type` (enum: cover_letter, technical_proposal, financial_bid, compliance_checklist, certificate), `status` (enum: ai_generated, drafted, ready, missing), `storage_url`, `content_ref` (link to generated_bids doc).
- **suppliers**: `supplier_id` (uuid, PK), `name`, `origin` (enum: local, import), `categories` (jsonb), `unit_costs` (jsonb), `location`.

### 7.2 Document store (MongoDB later, `jsonb` in MVP)
- **tender_documents**: `{ _id, tender_id, raw_text, sections: { eligibility, scope, ... }, extracted: { requirements: ["ISO 9001", "3 yrs experience"], documents_needed: ["NTN", "GST cert", "PEC license"], key_dates: { pre_bid, close } }, embeddings, attachments: [{ name: "boq.pdf", url: "s3://..." }] }`.
- **generated_bids**: `{ _id, bid_id, cover_letter, technical_proposal: { blocks: [...] }, financial_bid, compliance_checklist }`.

---

## 8. API surface (suggested REST routes)
Implement as Next.js route handlers in MVP. All authed routes require JWT and enforce plan gating.

- `POST /api/auth/*` (Auth.js handles login, signup, session).
- `GET /api/tenders` (query: filters, pagination) ; `GET /api/tenders/:id`.
- `POST /api/tenders/:id/analyze` -> runs extraction + eligibility + match score; returns the analyzer payload.
- `GET /api/matches` (for the logged-in company, used by dashboard and feed scoring).
- `POST /api/bids` (create from a match) ; `GET /api/bids` ; `GET /api/bids/:id` ; `PATCH /api/bids/:id`.
- `POST /api/bids/:id/generate` -> AI drafts requested sections.
- `POST /api/bids/:id/export` -> renders the bid pack to PDF.
- `GET /api/suppliers` (query: category, origin) ; `POST /api/tax/estimate` (contract value + costs -> profit and margin).
- `GET/PATCH /api/company` (profile) ; `GET /api/dashboard/summary` (KPIs + matched tenders + pipeline).

---

## 9. AI features (behaviour spec)
Wrap all of these behind `lib/ai` with typed inputs and outputs, and make each independently mockable.

1. **Requirement extraction:** input = raw tender text/attachments; output = structured `extracted` object (requirements, documents_needed, key_dates, eligibility criteria, scope). Use Claude with a strict JSON schema in the system prompt.
2. **Eligibility check:** compare `extracted.requirements` and `documents_needed` against the company profile; return per-criterion pass/fail/warning with a short detail string.
3. **Match score:** combine semantic similarity (embeddings of tender vs company capability profile) with eligibility pass rate and category experience into a 0 to 100 score; cache on `tender_matches`. Provide a one-line explanation.
4. **Bid generation:** given a tender and company profile, draft cover letter, technical proposal, and a financial-bid skeleton; return editable blocks; never fabricate certifications the company does not have.
5. **Profitability and tax:** deterministic calculator (not the LLM) for GST 18%, withholding 4.5%, SST, duties, logistics/overheads; the LLM only writes the sourcing recommendation text.
6. **Sourcing recommendation:** suggest cheaper suppliers from the Supplier Hub and quantify the margin impact.

Guardrails: AI output is always editable by the user; show "AI-generated" labels; keep a human in the loop before any bid is marked submitted.

---

## 10. Plan gating (pricing)
- **Free, PKR 0:** tender discovery, alerts, basic search. No AI matching, no bid generation, no profit analytics.
- **Professional, PKR 10,000 / month:** AI matching, AI analyzer, bid generation, tax and profit analytics.
- **Enterprise, PKR 25,000+ / month:** teams, API access, integrations, priority support.
Enforce gating server-side on the relevant endpoints, not just in the UI.

---

## 11. Seed data
Seed a demo company ("Ali", company profile with PPRA registration, PKR 31M avg turnover, textile experience, no ISO 9001 on file) and these sample tenders so the dashboard and analyzer look real immediately:

| Title | Sector | Value | City | Closes | Match |
|---|---|---|---|---|---|
| Supply of Security Uniforms, Rangers HQ | Defense | PKR 24.0M | Karachi | 12 Jun | 92% |
| Medical Equipment Procurement, PIMS | Healthcare | PKR 58.5M | Islamabad | 14 Jun | 88% |
| Network Infrastructure Upgrade, NUST | IT and Software | PKR 16.2M | Islamabad | 17 Jun | 74% |
| Construction of Boundary Wall, C&W Sindh | Construction | PKR 41.0M | Hyderabad | 19 Jun | 71% |

Dashboard KPIs to reproduce: Matched Tenders 38, Active Bids 9, Deadlines/7days 3, Avg Match Score 87%. Bid pipeline: 68% bid-ready, 18% missing documents, 14% under review.

---

## 12. Build phases (do them in order)

**Phase 0, Scaffolding.** Next.js + TypeScript + Tailwind with the design tokens, fonts, `Logo` component, app shell (sidebar + top bar), and the marketing landing page using the brand. Prisma + Postgres connected. Auth.js login/signup. Seed script.

**Phase 1, Discovery (maps to MVP / Q3 2026).** Tender Feed with filters and search, tender detail, dashboard with real KPIs and matched-tenders list, alerts. Matching can start rule-based, then add embeddings.

**Phase 2, Intelligence (Q4 2026).** AI Tender Analyzer (extraction, eligibility, match score, the three panels), Bid Generator (AI drafts + editable bid pack + PDF export), Tax and Profit calculator. Enforce plan gating.

**Phase 3, Sourcing and mobile (Q1 2027).** Supplier Hub with cost comparison and sourcing recommendations; React Native mobile app on the same API.

**Phase 4, Enterprise (Q3 2027 and beyond).** Team workspaces, analytics, public API, real connectors to EPADS/PPRA, provincial portals, FBR, and payment gateways; move document store to MongoDB and search to Elasticsearch if needed.

---

## 13. Coding conventions
- TypeScript strict mode; no `any` without justification.
- Feature-first folder structure (`app/`, `components/`, `lib/`, `server/`, `prisma/`).
- All colors and spacing from design tokens; no hardcoded hex in components.
- Server-side validation with zod on every API input.
- Every AI call goes through `lib/ai` with a mock implementation toggled by env, so the app builds and runs without API keys.
- Keep secrets in env vars; never commit them. Provide a `.env.example`.
- Accessibility: semantic HTML, labelled inputs, keyboard navigable, sufficient contrast.
- Write the smallest tests that prove each phase works (matching logic, tax calculator, plan gating).

---

## 14. Definition of done for the MVP (Phases 0 to 2)
- A user can sign up, complete the company profile, and log in.
- The dashboard shows live KPIs, matched tenders, and the bid pipeline.
- The tender feed lists and filters tenders and shows per-company match scores.
- Opening a tender runs the analyzer and shows eligibility, a bid pack with statuses, and the profit/tax breakdown.
- The user can generate and edit a bid pack and export it to PDF.
- Free vs Professional gating is enforced on AI features, server-side.
- The brand and screens match section 4 and section 6.

---

## 15. Out of scope for now
- The marketing site beyond a single landing page.
- Real ingestion connectors (use seed data and a manual "import tender by URL/paste" path in MVP).
- Payments beyond storing the chosen plan (wire a gateway in Phase 4).
- The pitch/marketing collateral (deck, brochure, standee) already exist as separate deliverables and are not part of the app.
