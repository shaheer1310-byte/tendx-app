import { NextResponse } from "next/server";
import { guardPublicApi } from "@/lib/public-api";
import { getTender } from "@/server/tenders";

/**
 * GET /api/v1/tenders/[id] -> a single tender with its match (Enterprise public
 * API; requires an API key, rate limited per key).
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const guard = guardPublicApi(req);
  if ("error" in guard) return guard.error;

  const tender = await getTender(params.id);
  if (!tender) {
    return NextResponse.json({ error: "Tender not found." }, { status: 404 });
  }
  return NextResponse.json({ data: tender }, { headers: guard.headers });
}
