import { NextResponse } from "next/server";
import { regenerateBid } from "@/server/bids";
import { isProfessional, PlanRequiredError } from "@/server/plan";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!isProfessional()) {
    return NextResponse.json(
      { error: "Bid generation requires the Professional plan." },
      { status: 403 },
    );
  }

  try {
    const bid = await regenerateBid(params.id);
    if (!bid) {
      return NextResponse.json({ error: "Bid not found." }, { status: 404 });
    }
    return NextResponse.json({ bid });
  } catch (err) {
    if (err instanceof PlanRequiredError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Could not regenerate the bid." },
      { status: 400 },
    );
  }
}
