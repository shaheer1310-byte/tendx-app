import { analyticsStats, dashboardStats } from "./data/fixtures";
import type { AnalyticsSummary } from "./types";

/**
 * Basic analytics rollup (Build Spec section 12, Phase 4). Deterministic: the
 * historical series come from the agreed demo figures (`analyticsStats`), while
 * the pipeline mix and average match score are shared with the dashboard so the
 * two views never disagree. Gating is enforced by the API route and page.
 */
export function getAnalyticsSummary(): AnalyticsSummary {
  return {
    winRatePct: analyticsStats.winRatePct,
    winRateDelta: analyticsStats.winRateDelta,
    bidsSubmitted: analyticsStats.bidsSubmitted,
    valueWonPkr: analyticsStats.valueWonPkr,
    pipelineValuePkr: analyticsStats.pipelineValuePkr,
    avgMatchScore: dashboardStats.avgMatchScore,
    monthly: analyticsStats.monthly,
    scoreDistribution: analyticsStats.scoreDistribution,
    topCategories: analyticsStats.topCategories,
    pipeline: dashboardStats.pipeline,
  };
}
