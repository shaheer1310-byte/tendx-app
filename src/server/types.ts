import type {
  EligibilityCriterion,
  ExtractedTender,
} from "@/lib/ai";

/** Buyer category for a tender (Build Spec section 7.1). */
export type BuyerType =
  | "federal"
  | "provincial"
  | "military"
  | "soe"
  | "private";

/** A tender as shown across the feed, detail and dashboard. */
export interface Tender {
  id: string;
  refNo: string;
  title: string;
  buyer: string;
  sector: string;
  category: string;
  valuePkr: number;
  city: string;
  province: string;
  buyerType: BuyerType;
  sourcePortal: string;
  publishedAt: string; // ISO date
  closesAt: string; // ISO date
  rawUrl?: string;
  imported?: boolean;
  extracted?: ExtractedTender;
}

/** Subscription plan (Build Spec section 10). */
export type Plan = "free" | "professional" | "enterprise";

/** Company capability profile used for eligibility and matching. */
export interface CompanyProfile {
  id: string;
  legalName: string;
  plan: Plan;
  ppraRegistered: boolean;
  avgTurnoverPkr: number;
  categoryExperience: string[];
  certifications: string[];
  city: string;
  province: string;
}

/** A per-company match against one tender. */
export interface TenderMatch {
  tenderId: string;
  score: number; // 0-100
  explanation: string;
  eligibility: EligibilityCriterion[];
}

/** A tender row joined with its match, ready for the UI. */
export interface TenderWithMatch extends Tender {
  match: TenderMatch;
}

/** Dashboard KPI + pipeline summary (Build Spec sections 6.1 and 11). */
export interface DashboardSummary {
  matchedTenders: number;
  matchedDelta: number;
  activeBids: number;
  activeInProgress: number;
  deadlines7d: number;
  avgMatchScore: number;
  avgDelta: number;
  pipeline: {
    bidReady: number;
    missingDocs: number;
    underReview: number;
  };
  matchedList: TenderWithMatch[];
}

/** Filters accepted by the tender feed (Build Spec section 6.2). */
export interface TenderFilters {
  keyword?: string;
  sector?: string;
  province?: string;
  buyerType?: BuyerType;
  minValue?: number;
  maxValue?: number;
  closingWithinDays?: number;
  sourcePortal?: string;
  sort?: "score" | "deadline" | "value" | "recency";
}

/* --- Bids (Build Spec sections 6.4 and 7.1) --- */

export type BidStatus =
  | "drafted"
  | "win_ready"
  | "missing_docs"
  | "under_review"
  | "submitted";

export type BidDocumentType =
  | "cover_letter"
  | "technical_proposal"
  | "financial_bid"
  | "compliance_checklist"
  | "certificate";

export type BidDocumentStatus =
  | "ai_generated"
  | "drafted"
  | "ready"
  | "missing";

export interface BidDocument {
  type: BidDocumentType;
  title: string;
  status: BidDocumentStatus;
  /** Editable text content for AI-drafted sections. */
  content?: string;
  /** Filename for an uploaded certificate (demo: not persisted to storage). */
  fileName?: string;
}

export interface Bid {
  id: string;
  tenderId: string;
  tenderTitle: string;
  companyId: string;
  status: BidStatus;
  documents: BidDocument[];
  createdAt: string;
  submittedAt?: string;
}

/* --- Tax and profitability (Build Spec sections 6.6 and 9.5) --- */

export interface TaxInput {
  contractValuePkr: number;
  procurementCostPkr: number;
  logisticsOverheadsPkr: number;
  gst: boolean;
  sst: boolean;
  withholding: boolean;
  duties: boolean;
}

export interface TaxLine {
  label: string;
  /** Negative for costs/taxes, positive for the contract value. */
  amountPkr: number;
}

export interface TaxEstimate {
  lines: TaxLine[];
  totalTaxPkr: number;
  netProfitPkr: number;
  marginPct: number;
}

/* --- Team workspaces and roles (Build Spec sections 6.7 and 7.1) --- */

/** Workspace role, highest privilege first (Build Spec section 7.1). */
export type Role = "owner" | "admin" | "member";

export type MemberStatus = "active" | "invited";

/** A user belonging to a company workspace. */
export interface TeamMember {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: Role;
  status: MemberStatus;
  joinedAt: string; // ISO date
}

/* --- Public API access (Build Spec sections 8, 10; Phase 4) --- */

/** An issued API key. The raw token is shown once at creation, never stored. */
export interface ApiKey {
  id: string;
  companyId: string;
  name: string;
  /** Visible prefix, e.g. "tendx_live_a1b2". */
  prefix: string;
  /** Last 4 chars for identification in the UI. */
  lastFour: string;
  /** SHA-256 of the full token; used to authenticate requests. */
  tokenHash: string;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

/** API key as exposed to the UI (never includes the hash or full token). */
export interface ApiKeyPublic {
  id: string;
  name: string;
  masked: string; // e.g. "tendx_live_a1b2…f9c0"
  createdAt: string;
  lastUsedAt?: string;
  revoked: boolean;
}

/* --- Analytics (Build Spec section 12, Phase 4) --- */

export interface MonthlyPoint {
  month: string; // e.g. "Jan"
  submitted: number;
  won: number;
}

export interface ScoreBucket {
  range: string; // e.g. "80-89"
  count: number;
}

export interface CategoryValue {
  category: string;
  valuePkr: number;
}

export interface AnalyticsSummary {
  winRatePct: number;
  winRateDelta: number;
  bidsSubmitted: number;
  valueWonPkr: number;
  pipelineValuePkr: number;
  avgMatchScore: number;
  monthly: MonthlyPoint[];
  scoreDistribution: ScoreBucket[];
  topCategories: CategoryValue[];
  pipeline: { bidReady: number; missingDocs: number; underReview: number };
}

/* --- Supplier Hub (Build Spec sections 6.5 and 9.6) --- */

/** Where an input is sourced from. */
export type SupplierOrigin = "local" | "import";

/** A supplier in the procurement-intelligence hub. */
export interface Supplier {
  id: string;
  name: string;
  city: string;
  province: string;
  country: string;
  origin: SupplierOrigin;
  categories: string[];
  rating: number; // 0-5
  leadTimeDays: number;
  verified: boolean;
}

/** A priced offer for a single input item from one supplier. */
export interface SupplierOffer {
  id: string;
  supplierId: string;
  supplierName: string; // denormalised for list rendering
  item: string;
  category: string;
  unit: string; // e.g. "set", "metre", "unit"
  unitPricePkr: number;
  origin: SupplierOrigin;
  minOrderQty: number;
}

/** One line of a tender's bill of quantities, with a baseline unit price. */
export interface BoqItem {
  item: string;
  category: string;
  qty: number;
  unit: string;
  baselineUnitPricePkr: number;
}

/** A cheaper-sourcing option found for a single BOQ line. */
export interface SourcingLine {
  item: string;
  qty: number;
  unit: string;
  baselineUnitPricePkr: number;
  baselineLineTotalPkr: number;
  /** The best cheaper offer found, if any. */
  best?: {
    supplierName: string;
    origin: SupplierOrigin;
    unitPricePkr: number;
    lineTotalPkr: number;
  };
  savingsPkr: number;
}

/**
 * Full sourcing plan for a tender: cheaper-sourcing options plus the margin
 * impact, computed by running the deterministic tax calculator before and
 * after the savings (Build Spec sections 9.5 and 9.6).
 */
export interface SourcingPlan {
  tenderId: string;
  tenderTitle: string;
  lines: SourcingLine[];
  baselineProcurementPkr: number;
  optimizedProcurementPkr: number;
  totalSavingsPkr: number;
  baselineMarginPct: number;
  optimizedMarginPct: number;
  marginLiftPct: number;
  /** LLM-written narrative (the only generative part). */
  narrative: string;
}

/* --- Analyzer payload (Build Spec section 6.3) --- */

export interface AnalyzerPayload {
  tender: TenderWithMatch;
  insight: string;
  bidPack: BidDocument[];
  profitability: TaxEstimate;
  sourcing: { text: string; estimatedMarginLiftPct: number };
}
