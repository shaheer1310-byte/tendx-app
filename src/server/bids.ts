import { randomUUID } from "node:crypto";
import { getAiService } from "@/lib/ai";
import type { ExtractedTender } from "@/lib/ai";
import { assertProfessional } from "./plan";
import { ensureCompanyBids } from "./store";
import { getActiveCompany, getActiveCompanyId } from "./tenant";
import { ensureExtracted, getTender } from "./tenders";
import type { Bid, BidDocument, CompanyProfile, Tender } from "./types";

const EMPTY_EXTRACT: ExtractedTender = {
  requirements: [],
  documentsNeeded: [],
  keyDates: {},
  scope: "",
};

/** Required certificates named in the tender that the company does not hold. */
export function missingCertificates(
  tender: Tender,
  company: CompanyProfile,
): string[] {
  const out: string[] = [];
  for (const req of tender.extracted?.requirements ?? []) {
    const lower = req.toLowerCase();
    if (
      lower.includes("iso 9001") &&
      !company.certifications.some((c) => c.toLowerCase().includes("iso 9001"))
    ) {
      out.push("ISO 9001 Certificate");
    }
  }
  return out;
}

/**
 * Build the bid-pack documents for a tender (Build Spec sections 6.3 panel 2,
 * 6.4). AI drafts the cover letter, technical proposal and financial-bid
 * skeleton; the compliance checklist is ready; missing required certificates
 * appear as upload slots. The AI never fabricates a certificate (Build Spec 9.4).
 */
export async function buildBidPack(
  tender: Tender,
  company: CompanyProfile,
): Promise<BidDocument[]> {
  const ai = getAiService();
  const generated = await ai.generateBid({
    tenderTitle: tender.title,
    extracted: tender.extracted ?? EMPTY_EXTRACT,
    company,
  });
  const byType = new Map(generated.blocks.map((b) => [b.type, b]));

  const docs: BidDocument[] = [
    {
      type: "cover_letter",
      title: "Cover Letter",
      status: "ai_generated",
      content: byType.get("cover_letter")?.content ?? "",
    },
    {
      type: "technical_proposal",
      title: "Technical Proposal",
      status: "ai_generated",
      content: byType.get("technical_proposal")?.content ?? "",
    },
    {
      type: "financial_bid",
      title: "Financial Bid / BOQ",
      status: "drafted",
      content: byType.get("financial_bid")?.content ?? "",
    },
    {
      type: "compliance_checklist",
      title: "Compliance Checklist",
      status: "ready",
    },
  ];

  for (const cert of missingCertificates(tender, company)) {
    docs.push({ type: "certificate", title: cert, status: "missing" });
  }

  return docs;
}

function statusFromDocs(documents: BidDocument[]): Bid["status"] {
  return documents.some((d) => d.status === "missing")
    ? "missing_docs"
    : "drafted";
}

export async function listBids(): Promise<Bid[]> {
  const companyId = await getActiveCompanyId();
  return [...ensureCompanyBids(companyId)].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function getBid(id: string): Promise<Bid | null> {
  const companyId = await getActiveCompanyId();
  return ensureCompanyBids(companyId).find((b) => b.id === id) ?? null;
}

/** Create a bid pack from a tender (Professional only). */
export async function createBidFromTender(tenderId: string): Promise<Bid> {
  assertProfessional();
  const companyId = await getActiveCompanyId();
  const tender = await getTender(tenderId);
  if (!tender) throw new Error("Tender not found.");

  await ensureExtracted(tenderId);
  const refreshed = (await getTender(tenderId)) ?? tender;
  const documents = await buildBidPack(refreshed, await getActiveCompany());

  const bid: Bid = {
    id: randomUUID(),
    tenderId: refreshed.id,
    tenderTitle: refreshed.title,
    companyId,
    status: statusFromDocs(documents),
    documents,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  ensureCompanyBids(companyId).push(bid);
  return bid;
}

/** Re-run AI drafting for a bid's generated sections (Professional only). */
export async function regenerateBid(id: string): Promise<Bid | null> {
  assertProfessional();
  const bid = await getBid(id);
  if (!bid) return null;
  const tender = await getTender(bid.tenderId);
  if (!tender) return bid;

  const fresh = await buildBidPack(tender, await getActiveCompany());
  const freshByType = new Map(fresh.map((d) => [d.type, d]));
  // Refresh AI-generated text but keep any uploaded certificates.
  bid.documents = bid.documents.map((d) =>
    d.status === "ai_generated" && freshByType.has(d.type)
      ? { ...d, content: freshByType.get(d.type)!.content }
      : d,
  );
  return bid;
}

export interface UpdateBidInput {
  status?: Bid["status"];
  documents?: BidDocument[];
}

export async function updateBid(
  id: string,
  input: UpdateBidInput,
): Promise<Bid | null> {
  const bid = await getBid(id);
  if (!bid) return null;
  if (input.documents) bid.documents = input.documents;
  if (input.status) {
    bid.status = input.status;
    if (input.status === "submitted") {
      bid.submittedAt = new Date().toISOString().slice(0, 10);
    }
  }
  return bid;
}
