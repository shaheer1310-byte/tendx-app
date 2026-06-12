import { NextResponse } from "next/server";
import { isProfessional } from "@/server/plan";
import { sourcingPlan } from "@/server/suppliers";

/**
 * GET /api/suppliers/sourcing/[tenderId]
 * Cheaper-sourcing options for a tender plus the margin impact (Build Spec
 * sections 6.5 and 9.6). Profit analytics are Professional-only (section 10).
 */
export async function GET(
  _req: Request,
  { params }: { params: { tenderId: string } },
) {
  if (!isProfessional()) {
    return NextResponse.json(
      { error: "Sourcing and margin analytics require the Professional plan." },
      { status: 403 },
    );
  }

  const plan = await sourcingPlan(params.tenderId);
  if (!plan) {
    return NextResponse.json({ error: "Tender not found." }, { status: 404 });
  }
  return NextResponse.json(plan);
}
