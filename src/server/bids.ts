import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
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

/**
 * Bids are persisted to Postgres (`workspace_bids`) when a database is reachable
 * so generated bids survive across serverless instances (each Vercel route is a
 * separate function with its own in-memory store). The in-memory store is the
 * fallback for local no-DB runs. Both paths are tenant-scoped by companyId.
 */
async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

type PrismaLike = Awaited<ReturnType<typeof getPrisma>>;

/** A persisted bid row, mapped back to the runtime `Bid` shape. */
function rowToBid(row: {
  id: string;
  companyId: string;
  tenderId: string;
  tenderTitle: string;
  status: string;
  documents: Prisma.JsonValue;
  createdAt: string;
  submittedAt: string | null;
}): Bid {
  return {
    id: row.id,
    tenderId: row.tenderId,
    tenderTitle: row.tenderTitle,
    companyId: row.companyId,
    status: row.status as Bid["status"],
    documents: row.documents as unknown as BidDocument[],
    createdAt: row.createdAt,
    submittedAt: row.submittedAt ?? undefined,
  };
}

/** The runtime `Bid` mapped to a `workspace_bids` write payload. */
function bidToData(bid: Bid) {
  return {
    id: bid.id,
    companyId: bid.companyId,
    tenderId: bid.tenderId,
    tenderTitle: bid.tenderTitle,
    status: bid.status,
    documents: bid.documents as unknown as Prisma.InputJsonValue,
    createdAt: bid.createdAt,
    submittedAt: bid.submittedAt ?? null,
  };
}

/**
 * Provision the demo seed bids into the DB for a company on first access, so a
 * new account's bids list looks populated (§11). Seed ids are namespaced per
 * company to stay globally unique; `skipDuplicates` makes this idempotent and
 * race-safe.
 */
async function ensureDbSeed(prisma: PrismaLike, companyId: string) {
  const count = await prisma.workspaceBid.count({ where: { companyId } });
  if (count > 0) return;
  const seeded = ensureCompanyBids(companyId).map((b) =>
    bidToData({ ...b, id: `${b.id}-${companyId}` }),
  );
  if (seeded.length) {
    await prisma.workspaceBid.createMany({ data: seeded, skipDuplicates: true });
  }
}

export async function listBids(): Promise<Bid[]> {
  const companyId = await getActiveCompanyId();
  try {
    const prisma = await getPrisma();
    await ensureDbSeed(prisma, companyId);
    const rows = await prisma.workspaceBid.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(rowToBid);
  } catch {
    return [...ensureCompanyBids(companyId)].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }
}

export async function getBid(id: string): Promise<Bid | null> {
  const companyId = await getActiveCompanyId();
  try {
    const prisma = await getPrisma();
    await ensureDbSeed(prisma, companyId);
    const row = await prisma.workspaceBid.findFirst({ where: { id, companyId } });
    return row ? rowToBid(row) : null;
  } catch {
    return ensureCompanyBids(companyId).find((b) => b.id === id) ?? null;
  }
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

  try {
    const prisma = await getPrisma();
    await ensureDbSeed(prisma, companyId);
    await prisma.workspaceBid.create({ data: bidToData(bid) });
  } catch {
    ensureCompanyBids(companyId).push(bid);
  }
  return bid;
}

/** Re-run AI drafting for a bid's generated sections (Professional only). */
export async function regenerateBid(id: string): Promise<Bid | null> {
  assertProfessional();
  const companyId = await getActiveCompanyId();
  const bid = await getBid(id);
  if (!bid) return null;
  const tender = await getTender(bid.tenderId);
  if (!tender) return bid;

  const fresh = await buildBidPack(tender, await getActiveCompany());
  const freshByType = new Map(fresh.map((d) => [d.type, d]));
  // Refresh AI-generated text but keep any uploaded certificates.
  const documents = bid.documents.map((d) =>
    d.status === "ai_generated" && freshByType.has(d.type)
      ? { ...d, content: freshByType.get(d.type)!.content }
      : d,
  );
  const updated: Bid = { ...bid, documents };

  try {
    const prisma = await getPrisma();
    await prisma.workspaceBid.update({
      where: { id },
      data: { documents: documents as unknown as Prisma.InputJsonValue },
    });
  } catch {
    const mem = ensureCompanyBids(companyId).find((b) => b.id === id);
    if (mem) mem.documents = documents;
  }
  return updated;
}

export interface UpdateBidInput {
  status?: Bid["status"];
  documents?: BidDocument[];
}

export async function updateBid(
  id: string,
  input: UpdateBidInput,
): Promise<Bid | null> {
  const companyId = await getActiveCompanyId();
  const bid = await getBid(id);
  if (!bid) return null;

  const documents = input.documents ?? bid.documents;
  let status = bid.status;
  let submittedAt = bid.submittedAt;
  if (input.status) {
    status = input.status;
    if (input.status === "submitted") {
      submittedAt = new Date().toISOString().slice(0, 10);
    }
  }
  const updated: Bid = { ...bid, documents, status, submittedAt };

  try {
    const prisma = await getPrisma();
    await prisma.workspaceBid.update({
      where: { id },
      data: {
        documents: documents as unknown as Prisma.InputJsonValue,
        status,
        submittedAt: submittedAt ?? null,
      },
    });
  } catch {
    const mem = ensureCompanyBids(companyId).find((b) => b.id === id);
    if (mem) {
      mem.documents = documents;
      mem.status = status;
      mem.submittedAt = submittedAt;
    }
  }
  return updated;
}
