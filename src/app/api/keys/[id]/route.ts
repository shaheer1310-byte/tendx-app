import { NextResponse } from "next/server";
import { assertEnterprise } from "@/server/plan";
import { assertRole } from "@/server/auth-context";
import { revokeKey } from "@/server/apikeys";
import { toApiError } from "@/lib/api-errors";

/** DELETE /api/keys/[id] -> revoke a key (Enterprise + admin). */
export function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    assertEnterprise();
    assertRole("admin");
    if (!revokeKey(params.id)) {
      return NextResponse.json({ error: "Key not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiError(err);
  }
}
