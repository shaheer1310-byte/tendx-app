import { NextResponse } from "next/server";
import { z } from "zod";
import { getBid, updateBid } from "@/server/bids";
import { isProfessional } from "@/server/plan";

const docSchema = z.object({
  type: z.enum([
    "cover_letter",
    "technical_proposal",
    "financial_bid",
    "compliance_checklist",
    "certificate",
  ]),
  title: z.string(),
  status: z.enum(["ai_generated", "drafted", "ready", "missing"]),
  content: z.string().optional(),
  fileName: z.string().optional(),
});

const patchSchema = z.object({
  status: z
    .enum(["drafted", "win_ready", "missing_docs", "under_review", "submitted"])
    .optional(),
  documents: z.array(docSchema).optional(),
});

function gate() {
  return isProfessional()
    ? null
    : NextResponse.json(
        { error: "Bid generation requires the Professional plan." },
        { status: 403 },
      );
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const blocked = gate();
  if (blocked) return blocked;

  const bid = await getBid(params.id);
  if (!bid) {
    return NextResponse.json({ error: "Bid not found." }, { status: 404 });
  }
  return NextResponse.json({ bid });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const blocked = gate();
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const bid = await updateBid(params.id, parsed.data);
  if (!bid) {
    return NextResponse.json({ error: "Bid not found." }, { status: 404 });
  }
  return NextResponse.json({ bid });
}
