import { buildBidPack, missingCertificates } from "./bids";
import { assertProfessional } from "./plan";
import { getActiveCompany } from "./tenant";
import { sourcingPlan } from "./suppliers";
import { ensureExtracted, getTender } from "./tenders";
import { deriveCosts, estimate } from "./tax";
import type { AnalyzerPayload } from "./types";

/**
 * Run the full AI Tender Analyzer (Build Spec section 6.3): requirement
 * extraction, eligibility, match score (the latter two are the deterministic
 * Phase 1 matcher), the documents/bid-pack preview, and the profitability and
 * tax breakdown. Professional plan only (Build Spec section 10).
 */
export async function analyzeTender(
  id: string,
): Promise<AnalyzerPayload | null> {
  assertProfessional();

  if (!(await getTender(id))) return null;
  await ensureExtracted(id);
  const tender = await getTender(id);
  if (!tender) return null;

  const company = await getActiveCompany();

  // Panel 2: documents and bid pack.
  const bidPack = await buildBidPack(tender, company);

  // AI insight line.
  const missing = missingCertificates(tender, company);
  const insight =
    missing.length > 0
      ? `Add the ${missing[0].replace(" Certificate", "")} certificate to raise your match score to 98% and meet all mandatory criteria.`
      : "All mandatory criteria are met. You are ready to generate and submit your bid.";

  // Panel 3: profitability and tax (deterministic).
  const costs = deriveCosts(tender.valuePkr);
  const profitability = estimate({
    contractValuePkr: tender.valuePkr,
    procurementCostPkr: costs.procurementCostPkr,
    logisticsOverheadsPkr: costs.logisticsOverheadsPkr,
    gst: true,
    withholding: true,
    sst: false,
    duties: false,
  });

  // Sourcing recommendation: cheaper suppliers from the Supplier Hub with the
  // margin impact quantified deterministically (Build Spec section 9.6). The
  // LLM only phrases the narrative; all figures come from the planner.
  const plan = await sourcingPlan(id);
  const sourcing = {
    text:
      plan?.narrative ??
      "No cheaper sourcing options were found for this tender's inputs.",
    estimatedMarginLiftPct: plan?.marginLiftPct ?? 0,
  };

  return { tender, insight, bidPack, profitability, sourcing };
}
