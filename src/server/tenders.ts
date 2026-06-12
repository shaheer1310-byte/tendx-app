import { randomUUID } from "node:crypto";
import { getAiService } from "@/lib/ai";
import { computeMatch } from "./matching";
import { store } from "./store";
import { getActiveCompany, getActiveCompanyId, getActiveMatches } from "./tenant";
import { ensureCompanyMatches } from "./store";
import type {
  CompanyProfile,
  Tender,
  TenderFilters,
  TenderMatch,
  TenderWithMatch,
} from "./types";

function daysUntil(iso: string): number {
  const close = new Date(iso).getTime();
  const now = Date.now();
  return Math.ceil((close - now) / (1000 * 60 * 60 * 24));
}

function withMatch(
  tender: Tender,
  matches: Map<string, TenderMatch>,
  company: CompanyProfile,
): TenderWithMatch {
  const match = matches.get(tender.id) ?? computeMatch(tender, company);
  return { ...tender, match };
}

/** List tenders for the logged-in company, filtered and sorted (section 6.2). */
export async function listTenders(
  filters: TenderFilters = {},
): Promise<TenderWithMatch[]> {
  const company = await getActiveCompany();
  const matches = await getActiveMatches();
  let rows = store.tenders.map((t) => withMatch(t, matches, company));

  const { keyword, sector, province, buyerType, minValue, maxValue, closingWithinDays, sourcePortal } =
    filters;

  if (keyword) {
    const k = keyword.toLowerCase();
    rows = rows.filter(
      (t) =>
        t.title.toLowerCase().includes(k) ||
        t.buyer.toLowerCase().includes(k) ||
        t.category.toLowerCase().includes(k) ||
        t.sector.toLowerCase().includes(k),
    );
  }
  if (sector) rows = rows.filter((t) => t.sector === sector);
  if (province) rows = rows.filter((t) => t.province === province);
  if (buyerType) rows = rows.filter((t) => t.buyerType === buyerType);
  if (sourcePortal) rows = rows.filter((t) => t.sourcePortal === sourcePortal);
  if (typeof minValue === "number")
    rows = rows.filter((t) => t.valuePkr >= minValue);
  if (typeof maxValue === "number")
    rows = rows.filter((t) => t.valuePkr <= maxValue);
  if (typeof closingWithinDays === "number")
    rows = rows.filter((t) => daysUntil(t.closesAt) <= closingWithinDays);

  switch (filters.sort ?? "score") {
    case "deadline":
      rows.sort((a, b) => a.closesAt.localeCompare(b.closesAt));
      break;
    case "value":
      rows.sort((a, b) => b.valuePkr - a.valuePkr);
      break;
    case "recency":
      rows.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      break;
    case "score":
    default:
      rows.sort((a, b) => b.match.score - a.match.score);
      break;
  }

  return rows;
}

export async function getTender(id: string): Promise<TenderWithMatch | null> {
  const tender = store.tenders.find((t) => t.id === id);
  if (!tender) return null;
  const company = await getActiveCompany();
  const matches = await getActiveMatches();
  return withMatch(tender, matches, company);
}

/** Ensure a tender has AI-extracted requirements, running extraction if not. */
export async function ensureExtracted(id: string) {
  const raw = store.tenders.find((t) => t.id === id);
  if (raw && !raw.extracted) {
    const ai = getAiService();
    raw.extracted = await ai.extractRequirements({
      rawText: `${raw.title}. Sector: ${raw.sector}. Category: ${raw.category}.`,
    });
  }
  return raw?.extracted;
}

export interface ImportTenderInput {
  title: string;
  rawText: string;
  rawUrl?: string;
  buyer?: string;
  sector?: string;
  category?: string;
  valuePkr?: number;
  city?: string;
  province?: string;
  closesAt?: string;
}

/**
 * Manual "import tender by paste/URL" path (Build Spec section 15). Runs the
 * (mock) AI requirement extraction, then a rule-based match, and stores it.
 */
export async function importTender(
  input: ImportTenderInput,
): Promise<TenderWithMatch> {
  const ai = getAiService();
  const extracted = await ai.extractRequirements({ rawText: input.rawText });

  const id = randomUUID();
  const tender: Tender = {
    id,
    refNo: `IMPORT/${id.slice(0, 8)}`,
    title: input.title,
    buyer: input.buyer || "Unknown buyer",
    sector: input.sector || "General",
    category: input.category || "General goods",
    valuePkr: input.valuePkr ?? 0,
    city: input.city || "—",
    province: input.province || "—",
    buyerType: "private",
    sourcePortal: input.rawUrl ? "Imported (URL)" : "Imported (paste)",
    publishedAt: new Date().toISOString().slice(0, 10),
    closesAt: input.closesAt || extracted.keyDates.close || "",
    rawUrl: input.rawUrl,
    imported: true,
    extracted,
  };

  const companyId = await getActiveCompanyId();
  const company = await getActiveCompany();
  const match: TenderMatch = computeMatch(tender, company);

  store.tenders.push(tender);
  // Record the match in the importing company's own map (other companies will
  // compute their own match lazily against their profile).
  ensureCompanyMatches(companyId).set(id, match);

  return { ...tender, match };
}

export { daysUntil };
