import { NextResponse } from "next/server";
import { isProfessional } from "@/server/plan";
import { getAnalyticsSummary } from "@/server/analytics";

/**
 * GET /api/analytics/summary -> win rate, value won, pipeline, monthly history,
 * score distribution and top categories. Analytics are a Professional feature
 * (Build Spec section 10).
 */
export function GET() {
  if (!isProfessional()) {
    return NextResponse.json(
      { error: "Analytics require the Professional plan.", requiredPlan: "professional" },
      { status: 403 },
    );
  }
  return NextResponse.json(getAnalyticsSummary());
}
