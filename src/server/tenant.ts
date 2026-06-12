import { auth } from "@/lib/auth";
import { demoCompany } from "./data/fixtures";
import { ensureCompany, ensureCompanyMatches } from "./store";
import type { CompanyProfile, TenderMatch } from "./types";

/**
 * The company whose data the current request should see. Resolved from the
 * signed Auth.js session set at login (never a client-set value). Falls back to
 * the demo company so unauthenticated server contexts (and the demo account)
 * still resolve to the populated demo dataset (Build Spec §11).
 */
export async function getActiveCompanyId(): Promise<string> {
  const session = await auth().catch(() => null);
  return session?.user?.companyId ?? demoCompany.id;
}

/** The active company's profile (per-account, lazily cloned from the demo). */
export async function getActiveCompany(): Promise<CompanyProfile> {
  return ensureCompany(await getActiveCompanyId());
}

/** The active company's matches map (per-account, lazily cloned from the seed). */
export async function getActiveMatches(): Promise<Map<string, TenderMatch>> {
  return ensureCompanyMatches(await getActiveCompanyId());
}
