import { dashboardStats } from "./data/fixtures";
import { listTenders } from "./tenders";
import { getActiveCompany } from "./tenant";
import type { CompanyProfile, DashboardSummary } from "./types";

/** Dashboard KPIs + matched list + pipeline (Build Spec sections 6.1 and 11). */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const matchedList = (await listTenders({ sort: "score" })).slice(0, 4);

  return {
    ...dashboardStats,
    matchedList,
  };
}

/** The active company's profile (per-account). */
export function getCompany(): Promise<CompanyProfile> {
  return getActiveCompany();
}
