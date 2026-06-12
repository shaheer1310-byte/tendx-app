import type { EligibilityCriterion, ExtractedTender } from "@/lib/ai";
import type { CompanyProfile, Tender, TenderMatch } from "./types";

/**
 * Rule-based tender matching (Build Spec sections 9.2-9.3, Phase 1).
 *
 * Deterministic and explainable: eligibility is checked criterion by criterion,
 * then a 0-100 score combines the eligibility pass rate with category overlap
 * and turnover headroom. Embeddings-based semantic matching is added later.
 */

const TURNOVER_THRESHOLD = 15_000_000;

function categoryOverlap(tender: Tender, company: CompanyProfile): number {
  const haystack = [
    tender.sector,
    tender.category,
    ...(tender.extracted?.requirements ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const hits = company.categoryExperience.filter((exp) =>
    haystack.includes(exp.toLowerCase()),
  ).length;
  if (company.categoryExperience.length === 0) return 0;
  return Math.min(1, hits / 1); // any single overlap counts as full category fit
}

export function checkEligibility(
  extracted: ExtractedTender | undefined,
  company: CompanyProfile,
): EligibilityCriterion[] {
  const out: EligibilityCriterion[] = [];

  out.push({
    criterion: "Active PPRA / EPADS registration",
    status: company.ppraRegistered ? "pass" : "fail",
    detail: company.ppraRegistered ? "verified" : "not on file",
  });

  out.push({
    criterion: "Turnover >= PKR 15M over 3 yrs",
    status: company.avgTurnoverPkr >= TURNOVER_THRESHOLD ? "pass" : "fail",
    detail: `your avg PKR ${(company.avgTurnoverPkr / 1_000_000).toFixed(0)}M`,
  });

  out.push({
    criterion: "Category experience",
    status: company.categoryExperience.length > 0 ? "pass" : "warning",
    detail:
      company.categoryExperience.length > 0
        ? `${company.categoryExperience.join(", ")} on record`
        : "no similar contracts on record",
  });

  // Certificate requirements detected in the extracted requirements.
  const requirements = extracted?.requirements ?? [];
  for (const req of requirements) {
    const lower = req.toLowerCase();
    if (lower.includes("iso 9001")) {
      const has = company.certifications.some((c) =>
        c.toLowerCase().includes("iso 9001"),
      );
      out.push({
        criterion: "ISO 9001 quality certificate",
        status: has ? "pass" : "fail",
        detail: has ? "on file" : "not on file, required",
      });
    }
  }

  out.push({
    criterion: "Earnest money 2%",
    status: "warning",
    detail: "pay order pending upload",
  });

  return out;
}

export function computeMatch(
  tender: Tender,
  company: CompanyProfile,
): TenderMatch {
  const eligibility = checkEligibility(tender.extracted, company);

  const passes = eligibility.filter((e) => e.status === "pass").length;
  const fails = eligibility.filter((e) => e.status === "fail").length;
  const passRate = eligibility.length ? passes / eligibility.length : 0;

  const overlap = categoryOverlap(tender, company);
  const turnoverHeadroom = Math.min(
    1,
    company.avgTurnoverPkr / Math.max(TURNOVER_THRESHOLD, tender.valuePkr * 0.5),
  );

  // Weighted blend, then a penalty for each hard fail.
  const raw =
    passRate * 0.6 + overlap * 0.3 + turnoverHeadroom * 0.1;
  const score = Math.max(
    0,
    Math.min(100, Math.round(raw * 100 - fails * 6)),
  );

  let explanation: string;
  if (score >= 85) {
    explanation =
      "Strong fit: most mandatory criteria already met.";
  } else if (score >= 70) {
    explanation =
      "Good fit: eligible to bid, close the open items to raise the score.";
  } else {
    explanation =
      "Partial fit: outside your core category or missing key criteria.";
  }

  return { tenderId: tender.id, score, explanation, eligibility };
}
