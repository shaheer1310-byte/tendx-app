import { NextResponse } from "next/server";
import { listTenders } from "@/server/tenders";

/**
 * GET /api/matches (Build Spec section 8) -> the logged-in company's tender
 * matches, used by the dashboard and feed scoring. Discovery-level data, open
 * across plans (the AI that produces scores is gated upstream).
 */
export async function GET() {
  const matches = (await listTenders({ sort: "score" })).map((t) => ({
    tenderId: t.id,
    title: t.title,
    score: t.match.score,
    explanation: t.match.explanation,
    eligibility: t.match.eligibility,
  }));
  return NextResponse.json({ matches });
}
