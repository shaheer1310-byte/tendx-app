import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  demoCompany,
  seedApiKeys,
  seedBids,
  seedOffers,
  seedSuppliers,
  seedTenders,
  seedUsers,
} from "./data/fixtures";
import type {
  ApiKey,
  Bid,
  CompanyProfile,
  Role,
  Supplier,
  SupplierOffer,
  TeamMember,
  Tender,
  TenderMatch,
} from "./types";

/**
 * In-memory data store (Phase 1+). Seeded from the canonical fixtures so the app
 * runs with NO database — this includes auth (see `accounts`) so signup and
 * login work locally with zero setup. The store is a process singleton (same
 * pattern as the Prisma client), so signups and imported tenders persist across
 * requests until the server restarts. Prisma/Postgres remains the production
 * persistence path (prisma/seed.ts, lib/prisma.ts).
 *
 * Multi-tenant by `companyId`: tenders are a shared global pool, but each
 * company gets its own company profile, matches and bids (lazily cloned from the
 * demo seed) so a brand-new signup sees a fully populated demo (§11) while edits
 * stay that account's own. The active company is resolved from the signed
 * Auth.js session (`server/tenant.ts`), never a client-set value.
 */

/** An auth identity. Passwords are bcrypt-hashed, never stored in clear. */
export interface Account {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  companyId: string;
}

interface Store {
  /** Shared, global tender pool (Build Spec §6.2). */
  tenders: Tender[];
  /** The curated seed matches, used as the per-company clone source. */
  seedMatches: Map<string, TenderMatch>;
  suppliers: Supplier[];
  offers: SupplierOffer[];
  users: TeamMember[];
  apiKeys: ApiKey[];
  /** Auth identities (email + bcrypt hash + company linkage). */
  accounts: Account[];
  /** Per-company company profile, lazily cloned from the demo profile. */
  companiesByCompany: Map<string, CompanyProfile>;
  /** Per-company matches, lazily cloned from the curated seed matches. */
  matchesByCompany: Map<string, Map<string, TenderMatch>>;
  /** Per-company bids, lazily cloned from the seed bids. */
  bidsByCompany: Map<string, Bid[]>;
}

const globalForStore = globalThis as unknown as {
  tendxStore: Store | undefined;
};

/** The demo password documented in CLAUDE.md (ali@hassantextiles.pk). */
const DEMO_PASSWORD = "tendx-demo";

/** Clone the seed bids for a company, re-stamping ownership to that company. */
function cloneSeedBids(companyId: string): Bid[] {
  return seedBids.map((b) => ({
    ...b,
    companyId,
    documents: b.documents.map((d) => ({ ...d })),
  }));
}

/** Clone the curated seed matches into a fresh per-company map. */
function cloneSeedMatches(
  seedMatches: Map<string, TenderMatch>,
): Map<string, TenderMatch> {
  const out = new Map<string, TenderMatch>();
  for (const [tenderId, match] of seedMatches) {
    out.set(tenderId, {
      ...match,
      eligibility: match.eligibility.map((e) => ({ ...e })),
    });
  }
  return out;
}

function createStore(): Store {
  const tenders: Tender[] = [];
  const seedMatches = new Map<string, TenderMatch>();

  for (const seed of seedTenders) {
    const { match, ...tender } = seed;
    tenders.push(tender);
    seedMatches.set(tender.id, match);
  }

  // Clone seed users so runtime edits (invite/role/remove) do not mutate fixtures.
  const users: TeamMember[] = seedUsers.map((u) => ({ ...u }));
  const apiKeys: ApiKey[] = seedApiKeys.map((k) => ({ ...k }));

  // The demo login account, backed by the in-memory store (no DB required).
  const accounts: Account[] = [
    {
      id: seedUsers[0]?.id ?? randomUUID(),
      name: "Ali Hassan",
      email: "ali@hassantextiles.pk",
      passwordHash: bcrypt.hashSync(DEMO_PASSWORD, 10),
      role: "owner",
      companyId: demoCompany.id,
    },
  ];

  // The demo company starts fully provisioned (profile + matches + bids).
  const companiesByCompany = new Map<string, CompanyProfile>();
  companiesByCompany.set(demoCompany.id, { ...demoCompany });
  const matchesByCompany = new Map<string, Map<string, TenderMatch>>();
  matchesByCompany.set(demoCompany.id, cloneSeedMatches(seedMatches));
  const bidsByCompany = new Map<string, Bid[]>();
  bidsByCompany.set(demoCompany.id, cloneSeedBids(demoCompany.id));

  return {
    tenders,
    seedMatches,
    suppliers: seedSuppliers,
    offers: seedOffers,
    users,
    apiKeys,
    accounts,
    companiesByCompany,
    matchesByCompany,
    bidsByCompany,
  };
}

export const store: Store = globalForStore.tendxStore ?? createStore();

if (process.env.NODE_ENV !== "production") {
  globalForStore.tendxStore = store;
}

// --- Per-company data (lazily cloned from the demo seed) ---

/** The company's profile, cloned from the demo profile on first access. */
export function ensureCompany(companyId: string): CompanyProfile {
  let company = store.companiesByCompany.get(companyId);
  if (!company) {
    company = { ...demoCompany, id: companyId };
    store.companiesByCompany.set(companyId, company);
  }
  return company;
}

/** The company's matches, cloned from the curated seed on first access. */
export function ensureCompanyMatches(
  companyId: string,
): Map<string, TenderMatch> {
  let matches = store.matchesByCompany.get(companyId);
  if (!matches) {
    matches = cloneSeedMatches(store.seedMatches);
    store.matchesByCompany.set(companyId, matches);
  }
  return matches;
}

/** The company's bids, cloned from the seed on first access. */
export function ensureCompanyBids(companyId: string): Bid[] {
  let bids = store.bidsByCompany.get(companyId);
  if (!bids) {
    bids = cloneSeedBids(companyId);
    store.bidsByCompany.set(companyId, bids);
  }
  return bids;
}

// --- Auth helpers (in-memory) ---

export function findAccountByEmail(email: string): Account | undefined {
  const needle = email.trim().toLowerCase();
  return store.accounts.find((a) => a.email.toLowerCase() === needle);
}

/**
 * Create a new account + company and provision it with the demo dataset, so a
 * brand-new signup logs in to a fully populated demo (Build Spec §11). Tenders
 * are shared; the profile, matches and bids are this company's own clones.
 */
export async function createAccount(input: {
  name: string;
  email: string;
  password: string;
  companyName: string;
}): Promise<Account> {
  const companyId = randomUUID();
  const account: Account = {
    id: randomUUID(),
    name: input.name,
    email: input.email.trim(),
    passwordHash: await bcrypt.hash(input.password, 10),
    role: "owner",
    companyId,
  };
  store.accounts.push(account);
  // Provision the per-company dataset up front (also happens lazily on access).
  ensureCompany(companyId);
  ensureCompanyMatches(companyId);
  ensureCompanyBids(companyId);
  return account;
}
