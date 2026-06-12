import { NextResponse } from "next/server";
import { analyzeTender } from "@/server/analyzer";
import { isProfessional } from "@/server/plan";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  // Plan gating enforced server-side (Build Spec section 10).
  if (!isProfessional()) {
    return NextResponse.json(
      { error: "The AI Analyzer requires the Professional plan." },
      { status: 403 },
    );
  }

  const payload = await analyzeTender(params.id);
  if (!payload) {
    return NextResponse.json({ error: "Tender not found." }, { status: 404 });
  }
  return NextResponse.json(payload);
}
