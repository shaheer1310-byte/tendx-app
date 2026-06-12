import { NextResponse } from "next/server";
import { assertEnterprise } from "@/server/plan";
import { assertRole } from "@/server/auth-context";
import { getConnector, NotImplementedError } from "@/server/connectors";
import { toApiError } from "@/lib/api-errors";

/**
 * POST /api/connectors/[id]/sync -> trigger a connector run (Enterprise + admin).
 * Every connector is `planned`, so this surfaces the designed contract as
 * HTTP 501 Not Implemented rather than performing real ingestion.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    assertEnterprise();
    assertRole("admin");
    const connector = getConnector(params.id);
    if (!connector) {
      return NextResponse.json({ error: "Unknown connector." }, { status: 404 });
    }
    try {
      const result = await connector.sync();
      return NextResponse.json({ result });
    } catch (err) {
      if (err instanceof NotImplementedError) {
        return NextResponse.json(
          { error: err.message, status: "planned" },
          { status: 501 },
        );
      }
      throw err;
    }
  } catch (err) {
    return toApiError(err);
  }
}
