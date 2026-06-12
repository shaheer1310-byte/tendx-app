import { NextResponse } from "next/server";
import { assertEnterprise } from "@/server/plan";
import { listConnectorInfos } from "@/server/connectors";
import { toApiError } from "@/lib/api-errors";

/**
 * GET /api/connectors -> the connector catalogue (Enterprise, Build Spec §10).
 * All connectors are `planned`; this is the design surface (no live ingestion).
 */
export function GET() {
  try {
    assertEnterprise();
    return NextResponse.json({ connectors: listConnectorInfos() });
  } catch (err) {
    return toApiError(err);
  }
}
