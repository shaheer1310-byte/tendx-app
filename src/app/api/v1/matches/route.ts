import { NextResponse } from "next/server";
import { guardPublicApi } from "@/lib/public-api";
import { listTenders } from "@/server/tenders";

/**
 * GET /api/v1/matches -> the authenticated company's tender matches with scores
 * (Enterprise public API; requires an API key, rate limited per key).
 */
export async function GET(req: Request) {
  const guard = guardPublicApi(req);
  if ("error" in guard) return guard.error;

  const data = (await listTenders({ sort: "score" })).map((t) => ({
    tenderId: t.id,
    title: t.title,
    score: t.match.score,
    explanation: t.match.explanation,
  }));
  return NextResponse.json({ data }, { headers: guard.headers });
}
