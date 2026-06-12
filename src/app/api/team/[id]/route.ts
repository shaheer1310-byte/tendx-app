import { NextResponse } from "next/server";
import { z } from "zod";
import { assertEnterprise } from "@/server/plan";
import { removeMember, updateRole } from "@/server/team";
import { toApiError } from "@/lib/api-errors";

const patchSchema = z.object({ role: z.enum(["admin", "member"]) });

/** PATCH /api/team/[id] -> change a member's role (Enterprise + admin/owner). */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    assertEnterprise();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json({ member: updateRole(params.id, parsed.data.role) });
  } catch (err) {
    return toApiError(err);
  }
}

/** DELETE /api/team/[id] -> remove a member (Enterprise + admin/owner). */
export function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    assertEnterprise();
    removeMember(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiError(err);
  }
}
