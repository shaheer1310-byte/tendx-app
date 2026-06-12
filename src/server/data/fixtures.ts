import type { EligibilityCriterion } from "@/lib/ai";
import type {
  ApiKey,
  Bid,
  BoqItem,
  CompanyProfile,
  Supplier,
  SupplierOffer,
  TeamMember,
  Tender,
  TenderMatch,
} from "../types";

/**
 * Canonical demo data (Build Spec section 11). This is the single source of
 * truth: the in-memory store seeds from it, and prisma/seed.ts maps it into
 * Postgres, so the two never diverge.
 *
 * Demo login (after seeding a DB): ali@hassantextiles.pk / tendx-demo
 */

export const demoCompany: CompanyProfile = {
  id: "11111111-1111-1111-1111-111111111111",
  legalName: "Hassan Textiles (Pvt) Ltd",
  plan: "professional",
  ppraRegistered: true,
  avgTurnoverPkr: 31_000_000,
  categoryExperience: ["Textiles", "Defence textiles", "General goods"],
  certifications: ["GST Certificate", "NTN Certificate"], // no ISO 9001 on file
  city: "Karachi",
  province: "Sindh",
};

// Eligibility shown on the flagship analyzer example (Build Spec section 6.3).
const uniformsEligibility: EligibilityCriterion[] = [
  {
    criterion: "Active PPRA / EPADS registration",
    status: "pass",
    detail: "verified",
  },
  {
    criterion: "Turnover >= PKR 15M over 3 yrs",
    status: "pass",
    detail: "your avg PKR 31M",
  },
  {
    criterion: "Category experience (textiles)",
    status: "pass",
    detail: "5 similar contracts",
  },
  {
    criterion: "ISO 9001 quality certificate",
    status: "fail",
    detail: "not on file, required",
  },
  {
    criterion: "Earnest money 2% (PKR 480K)",
    status: "warning",
    detail: "pay order pending upload",
  },
];

function genericEligibility(detail: string): EligibilityCriterion[] {
  return [
    {
      criterion: "Active PPRA / EPADS registration",
      status: "pass",
      detail: "verified",
    },
    {
      criterion: "Turnover >= PKR 15M over 3 yrs",
      status: "pass",
      detail: "your avg PKR 31M",
    },
    {
      criterion: "Category experience",
      status: "warning",
      detail,
    },
    {
      criterion: "Earnest money 2%",
      status: "warning",
      detail: "pay order pending upload",
    },
  ];
}

interface SeedTender extends Tender {
  match: TenderMatch;
}

// The four sample tenders (Build Spec section 11) with their match scores.
export const seedTenders: SeedTender[] = [
  {
    id: "aaaaaaa1-0000-0000-0000-000000000001",
    refNo: "PPRA/2026/0001",
    title: "Supply of Security Uniforms, Rangers HQ",
    buyer: "Sindh Rangers HQ",
    sector: "Defense",
    category: "Textiles",
    valuePkr: 24_000_000,
    city: "Karachi",
    province: "Sindh",
    buyerType: "military",
    sourcePortal: "PPRA",
    publishedAt: "2026-06-01",
    closesAt: "2026-06-12",
    extracted: {
      requirements: [
        "3 years relevant experience",
        "ISO 9001 quality certificate",
        "Textile manufacturing capacity",
      ],
      documentsNeeded: ["NTN", "GST registration", "PPRA/EPADS registration"],
      keyDates: { preBid: "2026-06-05", close: "2026-06-12" },
      scope:
        "Supply and stitching of security uniforms against the published bill of quantities.",
    },
    match: {
      tenderId: "aaaaaaa1-0000-0000-0000-000000000001",
      score: 92,
      explanation: "Strong fit: textile experience and turnover clear the bar; add ISO 9001 to reach 98%.",
      eligibility: uniformsEligibility,
    },
  },
  {
    id: "aaaaaaa1-0000-0000-0000-000000000002",
    refNo: "PPRA/2026/0002",
    title: "Medical Equipment Procurement, PIMS",
    buyer: "PIMS Islamabad",
    sector: "Healthcare",
    category: "Medical Equipment",
    valuePkr: 58_500_000,
    city: "Islamabad",
    province: "Federal",
    buyerType: "federal",
    sourcePortal: "PPRA",
    publishedAt: "2026-06-02",
    closesAt: "2026-06-14",
    match: {
      tenderId: "aaaaaaa1-0000-0000-0000-000000000002",
      score: 88,
      explanation: "Good fit on registration and turnover; limited medical-equipment track record.",
      eligibility: genericEligibility("adjacent supply experience on record"),
    },
  },
  {
    id: "aaaaaaa1-0000-0000-0000-000000000003",
    refNo: "PPRA/2026/0003",
    title: "Network Infrastructure Upgrade, NUST",
    buyer: "NUST",
    sector: "IT and Software",
    category: "Networking",
    valuePkr: 16_200_000,
    city: "Islamabad",
    province: "Federal",
    buyerType: "soe",
    sourcePortal: "PPRA",
    publishedAt: "2026-06-03",
    closesAt: "2026-06-17",
    match: {
      tenderId: "aaaaaaa1-0000-0000-0000-000000000003",
      score: 74,
      explanation: "Partial fit: eligible to bid but outside your core category.",
      eligibility: genericEligibility("no similar IT contracts on record"),
    },
  },
  {
    id: "aaaaaaa1-0000-0000-0000-000000000004",
    refNo: "PPRA/2026/0004",
    title: "Construction of Boundary Wall, C&W Sindh",
    buyer: "C&W Department, Sindh",
    sector: "Construction",
    category: "Civil Works",
    valuePkr: 41_000_000,
    city: "Hyderabad",
    province: "Sindh",
    buyerType: "provincial",
    sourcePortal: "PPRA",
    publishedAt: "2026-06-04",
    closesAt: "2026-06-19",
    match: {
      tenderId: "aaaaaaa1-0000-0000-0000-000000000004",
      score: 71,
      explanation: "Partial fit: local to Sindh but limited civil-works experience.",
      eligibility: genericEligibility("no similar civil-works contracts on record"),
    },
  },
];

/**
 * Headline dashboard numbers (Build Spec sections 6.1 and 11). These are the
 * agreed demo figures and are larger than the four seeded sample tenders.
 */
export const dashboardStats = {
  matchedTenders: 38,
  matchedDelta: 12,
  activeBids: 9,
  activeInProgress: 4,
  deadlines7d: 3,
  avgMatchScore: 87,
  avgDelta: 5,
  pipeline: {
    bidReady: 68,
    missingDocs: 18,
    underReview: 14,
  },
};

/* --- Public API keys (Build Spec sections 8, 10; Phase 4) --- */

/**
 * One previously-issued key so the API access panel looks real. Display-only:
 * the raw token was shown once at creation and is not recoverable, so this
 * `tokenHash` has no known preimage and cannot authenticate. Issue a fresh key
 * from the panel (or `POST /api/keys`) to actually call the public API.
 */
export const seedApiKeys: ApiKey[] = [
  {
    id: "ce700000-0000-0000-0000-000000000001",
    companyId: demoCompany.id,
    name: "Production integration",
    prefix: "tendx_live_7f3a",
    lastFour: "9c0e",
    tokenHash:
      "0000000000000000000000000000000000000000000000000000000000000000",
    createdAt: "2026-05-02",
    lastUsedAt: "2026-06-10",
  },
];

/* --- Analytics (Build Spec section 12, Phase 4) --- */

/**
 * Agreed demo analytics figures (same convention as `dashboardStats`): larger
 * than the four seeded sample tenders so the charts look real immediately. The
 * win-rate / value-won / monthly history is a 6-month rollup to H1 2026.
 */
export const analyticsStats = {
  winRatePct: 34,
  winRateDelta: 6,
  bidsSubmitted: 41,
  valueWonPkr: 186_000_000,
  pipelineValuePkr: 139_700_000,
  monthly: [
    { month: "Jan", submitted: 4, won: 1 },
    { month: "Feb", submitted: 6, won: 2 },
    { month: "Mar", submitted: 7, won: 2 },
    { month: "Apr", submitted: 8, won: 3 },
    { month: "May", submitted: 9, won: 4 },
    { month: "Jun", submitted: 7, won: 2 },
  ],
  scoreDistribution: [
    { range: "50-59", count: 3 },
    { range: "60-69", count: 6 },
    { range: "70-79", count: 11 },
    { range: "80-89", count: 13 },
    { range: "90-100", count: 5 },
  ],
  topCategories: [
    { category: "Textiles", valuePkr: 84_000_000 },
    { category: "Medical Equipment", valuePkr: 58_500_000 },
    { category: "Civil Works", valuePkr: 41_000_000 },
    { category: "Networking", valuePkr: 16_200_000 },
  ],
};

/* --- Team workspace (Build Spec sections 6.7 and 7.1) --- */

/**
 * The demo company's team. "Ali" is the owner (matches the seed login). A mix
 * of roles and one pending invite so RBAC and the Team panel look real.
 */
export const seedUsers: TeamMember[] = [
  {
    id: "00000000-0000-0000-0000-0000000000a1",
    companyId: demoCompany.id,
    name: "Ali Hassan",
    email: "ali@hassantextiles.pk",
    role: "owner",
    status: "active",
    joinedAt: "2026-01-12",
  },
  {
    id: "00000000-0000-0000-0000-0000000000a2",
    companyId: demoCompany.id,
    name: "Sara Khan",
    email: "sara@hassantextiles.pk",
    role: "admin",
    status: "active",
    joinedAt: "2026-02-03",
  },
  {
    id: "00000000-0000-0000-0000-0000000000a3",
    companyId: demoCompany.id,
    name: "Bilal Ahmed",
    email: "bilal@hassantextiles.pk",
    role: "member",
    status: "active",
    joinedAt: "2026-03-21",
  },
  {
    id: "00000000-0000-0000-0000-0000000000a4",
    companyId: demoCompany.id,
    name: "Hina Raza",
    email: "hina@hassantextiles.pk",
    role: "member",
    status: "invited",
    joinedAt: "2026-06-09",
  },
];

/* --- Supplier Hub (Build Spec sections 6.5 and 9.6) --- */

/**
 * Demo suppliers across the seeded tender categories. A mix of local and
 * import origins so cost comparison and sourcing recommendations are real.
 */
export const seedSuppliers: Supplier[] = [
  {
    id: "5a000000-0000-0000-0000-000000000001",
    name: "Faisalabad Textile Mills",
    city: "Faisalabad",
    province: "Punjab",
    country: "Pakistan",
    origin: "local",
    categories: ["Textiles"],
    rating: 4.6,
    leadTimeDays: 14,
    verified: true,
  },
  {
    id: "5a000000-0000-0000-0000-000000000002",
    name: "Karachi Uniform Co.",
    city: "Karachi",
    province: "Sindh",
    country: "Pakistan",
    origin: "local",
    categories: ["Textiles"],
    rating: 4.2,
    leadTimeDays: 10,
    verified: true,
  },
  {
    id: "5a000000-0000-0000-0000-000000000003",
    name: "Guangzhou Fabrics Ltd",
    city: "Guangzhou",
    province: "Guangdong",
    country: "China",
    origin: "import",
    categories: ["Textiles"],
    rating: 4.4,
    leadTimeDays: 35,
    verified: false,
  },
  {
    id: "5a000000-0000-0000-0000-000000000004",
    name: "Sialkot Threads & Trims",
    city: "Sialkot",
    province: "Punjab",
    country: "Pakistan",
    origin: "local",
    categories: ["Textiles"],
    rating: 4.0,
    leadTimeDays: 9,
    verified: true,
  },
  {
    id: "5a000000-0000-0000-0000-000000000005",
    name: "MedSource Pakistan",
    city: "Lahore",
    province: "Punjab",
    country: "Pakistan",
    origin: "local",
    categories: ["Medical Equipment"],
    rating: 4.3,
    leadTimeDays: 21,
    verified: true,
  },
  {
    id: "5a000000-0000-0000-0000-000000000006",
    name: "Shenzhen MedTech Import",
    city: "Shenzhen",
    province: "Guangdong",
    country: "China",
    origin: "import",
    categories: ["Medical Equipment"],
    rating: 4.5,
    leadTimeDays: 40,
    verified: false,
  },
  {
    id: "5a000000-0000-0000-0000-000000000007",
    name: "NetGear Distributors Lahore",
    city: "Lahore",
    province: "Punjab",
    country: "Pakistan",
    origin: "local",
    categories: ["Networking"],
    rating: 4.1,
    leadTimeDays: 12,
    verified: true,
  },
  {
    id: "5a000000-0000-0000-0000-000000000008",
    name: "Dubai Network Supplies FZE",
    city: "Dubai",
    province: "Dubai",
    country: "UAE",
    origin: "import",
    categories: ["Networking"],
    rating: 4.4,
    leadTimeDays: 18,
    verified: true,
  },
  {
    id: "5a000000-0000-0000-0000-000000000009",
    name: "Sindh Builders Supply",
    city: "Hyderabad",
    province: "Sindh",
    country: "Pakistan",
    origin: "local",
    categories: ["Civil Works"],
    rating: 3.9,
    leadTimeDays: 7,
    verified: true,
  },
];

const supplierName = (id: string) =>
  seedSuppliers.find((s) => s.id === id)?.name ?? "Unknown supplier";

/**
 * Priced offers. For each category the locals/imports are priced so that a
 * cheaper alternative to the tender BOQ baseline exists, making the sourcing
 * recommendation and margin lift land on real numbers.
 */
export const seedOffers: SupplierOffer[] = [
  // Textiles (uniforms)
  {
    id: "0ffe0000-0000-0000-0000-000000000001",
    supplierId: "5a000000-0000-0000-0000-000000000001",
    supplierName: supplierName("5a000000-0000-0000-0000-000000000001"),
    item: "Poly-viscose uniform fabric",
    category: "Textiles",
    unit: "metre",
    unitPricePkr: 430,
    origin: "local",
    minOrderQty: 5000,
  },
  {
    id: "0ffe0000-0000-0000-0000-000000000002",
    supplierId: "5a000000-0000-0000-0000-000000000003",
    supplierName: supplierName("5a000000-0000-0000-0000-000000000003"),
    item: "Poly-viscose uniform fabric",
    category: "Textiles",
    unit: "metre",
    unitPricePkr: 365,
    origin: "import",
    minOrderQty: 20000,
  },
  {
    id: "0ffe0000-0000-0000-0000-000000000003",
    supplierId: "5a000000-0000-0000-0000-000000000004",
    supplierName: supplierName("5a000000-0000-0000-0000-000000000004"),
    item: "Buttons, thread and trims (per set)",
    category: "Textiles",
    unit: "set",
    unitPricePkr: 210,
    origin: "local",
    minOrderQty: 2000,
  },
  {
    id: "0ffe0000-0000-0000-0000-000000000004",
    supplierId: "5a000000-0000-0000-0000-000000000002",
    supplierName: supplierName("5a000000-0000-0000-0000-000000000002"),
    item: "Uniform stitching and finishing",
    category: "Textiles",
    unit: "set",
    unitPricePkr: 950,
    origin: "local",
    minOrderQty: 1000,
  },
  // Medical equipment
  {
    id: "0ffe0000-0000-0000-0000-000000000005",
    supplierId: "5a000000-0000-0000-0000-000000000005",
    supplierName: supplierName("5a000000-0000-0000-0000-000000000005"),
    item: "Patient monitoring unit",
    category: "Medical Equipment",
    unit: "unit",
    unitPricePkr: 285000,
    origin: "local",
    minOrderQty: 10,
  },
  {
    id: "0ffe0000-0000-0000-0000-000000000006",
    supplierId: "5a000000-0000-0000-0000-000000000006",
    supplierName: supplierName("5a000000-0000-0000-0000-000000000006"),
    item: "Patient monitoring unit",
    category: "Medical Equipment",
    unit: "unit",
    unitPricePkr: 232000,
    origin: "import",
    minOrderQty: 20,
  },
  // Networking
  {
    id: "0ffe0000-0000-0000-0000-000000000007",
    supplierId: "5a000000-0000-0000-0000-000000000007",
    supplierName: supplierName("5a000000-0000-0000-0000-000000000007"),
    item: "48-port managed switch",
    category: "Networking",
    unit: "unit",
    unitPricePkr: 420000,
    origin: "local",
    minOrderQty: 5,
  },
  {
    id: "0ffe0000-0000-0000-0000-000000000008",
    supplierId: "5a000000-0000-0000-0000-000000000008",
    supplierName: supplierName("5a000000-0000-0000-0000-000000000008"),
    item: "48-port managed switch",
    category: "Networking",
    unit: "unit",
    unitPricePkr: 368000,
    origin: "import",
    minOrderQty: 10,
  },
  // Civil works
  {
    id: "0ffe0000-0000-0000-0000-000000000009",
    supplierId: "5a000000-0000-0000-0000-000000000009",
    supplierName: supplierName("5a000000-0000-0000-0000-000000000009"),
    item: "Reinforced concrete blocks",
    category: "Civil Works",
    unit: "thousand",
    unitPricePkr: 78000,
    origin: "local",
    minOrderQty: 50,
  },
];

/**
 * Per-tender bill of quantities with the supplier's current baseline unit
 * prices. The sourcing planner beats these with cheaper offers above. Keyed by
 * tender id; tenders without an explicit BOQ fall back to a single synthetic
 * line in the service.
 */
export const seedBoqs: Record<string, BoqItem[]> = {
  // Security Uniforms, Rangers HQ (procurement ~PKR 17.4M of the 24.0M value)
  "aaaaaaa1-0000-0000-0000-000000000001": [
    {
      item: "Poly-viscose uniform fabric",
      category: "Textiles",
      qty: 24000,
      unit: "metre",
      baselineUnitPricePkr: 480,
    },
    {
      item: "Buttons, thread and trims (per set)",
      category: "Textiles",
      qty: 4000,
      unit: "set",
      baselineUnitPricePkr: 260,
    },
    {
      item: "Uniform stitching and finishing",
      category: "Textiles",
      qty: 4000,
      unit: "set",
      baselineUnitPricePkr: 1050,
    },
  ],
  // Medical Equipment, PIMS (procurement ~PKR 42.4M of the 58.5M value)
  "aaaaaaa1-0000-0000-0000-000000000002": [
    {
      item: "Patient monitoring unit",
      category: "Medical Equipment",
      qty: 150,
      unit: "unit",
      baselineUnitPricePkr: 285000,
    },
  ],
  // Network Infrastructure, NUST (procurement ~PKR 11.7M of the 16.2M value)
  "aaaaaaa1-0000-0000-0000-000000000003": [
    {
      item: "48-port managed switch",
      category: "Networking",
      qty: 28,
      unit: "unit",
      baselineUnitPricePkr: 420000,
    },
  ],
};

/** A few in-progress bids so the Bid Generator list looks real (section 6.4). */
export const seedBids: Bid[] = [
  {
    id: "b1d00000-0000-0000-0000-000000000001",
    tenderId: "aaaaaaa1-0000-0000-0000-000000000001",
    tenderTitle: "Supply of Security Uniforms, Rangers HQ",
    companyId: demoCompany.id,
    status: "missing_docs",
    createdAt: "2026-06-05",
    documents: [
      {
        type: "cover_letter",
        title: "Cover Letter",
        status: "ai_generated",
        content:
          "Dear Procurement Committee,\n\nHassan Textiles (Pvt) Ltd is pleased to submit this bid for the Supply of Security Uniforms for Sindh Rangers HQ. We confirm our PPRA registration, our three-year average turnover of PKR 31M and our textile manufacturing capacity, and we are ready to deliver within the stated timeline.",
      },
      {
        type: "technical_proposal",
        title: "Technical Proposal",
        status: "ai_generated",
        content:
          "1. Understanding of requirements\n2. Fabric sourcing and stitching methodology\n3. Quality assurance and inspection plan\n4. Delivery schedule and project team",
      },
      {
        type: "financial_bid",
        title: "Financial Bid / BOQ",
        status: "drafted",
        content:
          "Security uniform set x 4,000 | unit rate PKR 5,400 | line total PKR 21,600,000\nPacking and delivery | PKR 600,000",
      },
      {
        type: "compliance_checklist",
        title: "Compliance Checklist",
        status: "ready",
      },
      {
        type: "certificate",
        title: "ISO 9001 Certificate",
        status: "missing",
      },
    ],
  },
  {
    id: "b1d00000-0000-0000-0000-000000000002",
    tenderId: "aaaaaaa1-0000-0000-0000-000000000002",
    tenderTitle: "Medical Equipment Procurement, PIMS",
    companyId: demoCompany.id,
    status: "under_review",
    createdAt: "2026-06-06",
    documents: [
      {
        type: "cover_letter",
        title: "Cover Letter",
        status: "ai_generated",
        content:
          "Dear Procurement Committee,\n\nHassan Textiles (Pvt) Ltd submits this expression of interest for the Medical Equipment Procurement at PIMS Islamabad.",
      },
      {
        type: "technical_proposal",
        title: "Technical Proposal",
        status: "drafted",
        content: "Draft methodology pending technical review.",
      },
      {
        type: "compliance_checklist",
        title: "Compliance Checklist",
        status: "ready",
      },
    ],
  },
];
