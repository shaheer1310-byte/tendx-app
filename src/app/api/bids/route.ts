import { NextResponse } from "next/server";
import { z } from "zod";
import { createBidFromTender, listBids } from "@/server/bids";
import { isProfessional, PlanRequiredError } from "@/server/plan";

export async function GET() {
  if (!isProfessional()) {
    return NextResponse.json(
      { error: "Bid generation requires the Professional plan." },
      { status: 403 },
    );
  }
  return NextResponse.json({ bids: await listBids() });
}

const createSchema = z.object({ tenderId: z.string().min(1) });

export async function POST(req: Request) {
  if (!isProfessional()) {
    return NextResponse.json(
      { error: "Bid generation requires the Professional plan." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const bid = await createBidFromTender(parsed.data.tenderId);
    return NextResponse.json({ bid }, { status: 201 });
  } catch (err) {
    if (err instanceof PlanRequiredError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Could not create the bid." },
      { status: 400 },
    );
  }
}
