/**
 * Typed inputs/outputs for the TendX AI service (Build Spec section 9).
 * Every AI feature is defined here so the provider can be swapped or mocked
 * behind a single interface (Build Spec sections 3 and 13).
 */

export type EligibilityStatus = "pass" | "fail" | "warning";

export interface EligibilityCriterion {
  criterion: string;
  status: EligibilityStatus;
  detail: string;
}

export interface ExtractedTender {
  requirements: string[];
  documentsNeeded: string[];
  keyDates: { preBid?: string; close?: string };
  scope: string;
}

export interface CompanyProfileInput {
  legalName: string;
  ppraRegistered: boolean;
  avgTurnoverPkr: number;
  categoryExperience: string[];
  certifications: string[];
}

export interface MatchScoreResult {
  score: number; // 0-100
  explanation: string;
}

export type BidBlockType =
  | "cover_letter"
  | "technical_proposal"
  | "financial_bid";

export interface BidBlock {
  type: BidBlockType;
  title: string;
  content: string;
  aiGenerated: boolean;
}

export interface GeneratedBid {
  blocks: BidBlock[];
}

export interface SourcingRecommendation {
  text: string;
  estimatedMarginLiftPct: number;
}

/** The single interface every AI provider (mock or real) implements. */
export interface AiService {
  extractRequirements(input: { rawText: string }): Promise<ExtractedTender>;

  checkEligibility(input: {
    extracted: ExtractedTender;
    company: CompanyProfileInput;
  }): Promise<EligibilityCriterion[]>;

  matchScore(input: {
    extracted: ExtractedTender;
    company: CompanyProfileInput;
    eligibility: EligibilityCriterion[];
  }): Promise<MatchScoreResult>;

  generateBid(input: {
    tenderTitle: string;
    extracted: ExtractedTender;
    company: CompanyProfileInput;
  }): Promise<GeneratedBid>;

  sourcingRecommendation(input: {
    tenderTitle: string;
    inputCostPkr: number;
    /**
     * Deterministically computed figures from the Supplier Hub (Build Spec
     * section 9.6). The provider only phrases these into a sentence; it never
     * computes savings or margin itself (the money path stays deterministic,
     * Build Spec section 9.5).
     */
    bestSupplier?: string;
    bestOrigin?: "local" | "import";
    savingsPkr?: number;
    marginLiftPct?: number;
  }): Promise<SourcingRecommendation>;
}
