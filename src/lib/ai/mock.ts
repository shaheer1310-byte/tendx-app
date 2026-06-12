import type {
  AiService,
  EligibilityCriterion,
  ExtractedTender,
  GeneratedBid,
  MatchScoreResult,
  SourcingRecommendation,
} from "./types";

/**
 * Deterministic mock AI provider (Build Spec sections 9 and 13).
 * Returns realistic, schema-shaped responses so the whole app runs with no API
 * keys. The numbers mirror the seed/analyzer examples in the spec (section 6.3).
 */
export class MockAiService implements AiService {
  async extractRequirements({
    rawText,
  }: {
    rawText: string;
  }): Promise<ExtractedTender> {
    const lower = rawText.toLowerCase();
    const requirements = ["3 years relevant experience", "ISO 9001 quality certificate"];
    if (lower.includes("uniform") || lower.includes("textile")) {
      requirements.push("Textile manufacturing capacity");
    }
    return {
      requirements,
      documentsNeeded: ["NTN", "GST registration", "PPRA/EPADS registration"],
      keyDates: { preBid: "2026-06-05", close: "2026-06-12" },
      scope:
        "Supply, stitching and delivery against the published bill of quantities.",
    };
  }

  async checkEligibility({
    extracted,
    company,
  }: {
    extracted: ExtractedTender;
    company: { ppraRegistered: boolean; avgTurnoverPkr: number; categoryExperience: string[]; certifications: string[] };
  }): Promise<EligibilityCriterion[]> {
    const out: EligibilityCriterion[] = [];

    out.push({
      criterion: "Active PPRA / EPADS registration",
      status: company.ppraRegistered ? "pass" : "fail",
      detail: company.ppraRegistered ? "verified" : "not on file",
    });

    out.push({
      criterion: "Turnover >= PKR 15M over 3 yrs",
      status: company.avgTurnoverPkr >= 15_000_000 ? "pass" : "fail",
      detail: `your avg PKR ${(company.avgTurnoverPkr / 1_000_000).toFixed(0)}M`,
    });

    out.push({
      criterion: "Category experience",
      status: company.categoryExperience.length > 0 ? "pass" : "warning",
      detail:
        company.categoryExperience.length > 0
          ? `${company.categoryExperience.join(", ")}, similar contracts on record`
          : "no similar contracts on record",
    });

    const needsIso = extracted.requirements.some((r) =>
      r.toLowerCase().includes("iso 9001"),
    );
    if (needsIso) {
      const hasIso = company.certifications.some((c) =>
        c.toLowerCase().includes("iso 9001"),
      );
      out.push({
        criterion: "ISO 9001 quality certificate",
        status: hasIso ? "pass" : "fail",
        detail: hasIso ? "on file" : "not on file, required",
      });
    }

    out.push({
      criterion: "Earnest money 2%",
      status: "warning",
      detail: "pay order pending upload",
    });

    return out;
  }

  async matchScore({
    eligibility,
  }: {
    eligibility: EligibilityCriterion[];
  }): Promise<MatchScoreResult> {
    const passes = eligibility.filter((e) => e.status === "pass").length;
    const ratio = eligibility.length ? passes / eligibility.length : 0;
    const score = Math.round(60 + ratio * 38);
    return {
      score,
      explanation:
        score >= 85
          ? "Strong fit: most mandatory criteria already met."
          : "Partial fit: close the missing criteria to raise the score.",
    };
  }

  async generateBid({
    tenderTitle,
    company,
  }: {
    tenderTitle: string;
    company: { legalName: string };
  }): Promise<GeneratedBid> {
    return {
      blocks: [
        {
          type: "cover_letter",
          title: "Cover Letter",
          content: `Dear Procurement Committee,\n\n${company.legalName} is pleased to submit this bid for "${tenderTitle}". We confirm our compliance with the mandatory eligibility criteria and our capacity to deliver within the stated timeline.`,
          aiGenerated: true,
        },
        {
          type: "technical_proposal",
          title: "Technical Proposal",
          content:
            "1. Understanding of requirements\n2. Methodology and delivery plan\n3. Quality assurance and past performance\n4. Project team and timeline",
          aiGenerated: true,
        },
        {
          type: "financial_bid",
          title: "Financial Bid / BOQ",
          content:
            "Line items with unit rates to be confirmed against the published bill of quantities.",
          aiGenerated: true,
        },
      ],
    };
  }

  async sourcingRecommendation({
    inputCostPkr,
    bestSupplier,
    bestOrigin,
    savingsPkr,
    marginLiftPct,
  }: {
    tenderTitle: string;
    inputCostPkr: number;
    bestSupplier?: string;
    bestOrigin?: "local" | "import";
    savingsPkr?: number;
    marginLiftPct?: number;
  }): Promise<SourcingRecommendation> {
    // When the Supplier Hub has quantified the saving, phrase those exact
    // (deterministic) figures. Otherwise fall back to a generic suggestion.
    if (bestSupplier && savingsPkr && savingsPkr > 0) {
      const savingsK = Math.round(savingsPkr / 1000).toLocaleString();
      const lift = (marginLiftPct ?? 0).toFixed(1);
      return {
        text: `Switching key inputs to ${bestSupplier} (${bestOrigin ?? "local"}) cuts procurement cost by about PKR ${savingsK}K and lifts your margin by ${lift} points.`,
        estimatedMarginLiftPct: marginLiftPct ?? 0,
      };
    }
    return {
      text: `Source lining fabric from a local Faisalabad supplier to cut input cost about 6% (approx PKR ${Math.round(
        (inputCostPkr * 0.06) / 1000,
      ).toLocaleString()}K) and lift margin to 19%.`,
      estimatedMarginLiftPct: 4.2,
    };
  }
}
