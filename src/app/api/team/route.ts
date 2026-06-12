import { NextResponse } from "next/server";
import { z } from "zod";
import { assertEnterprise } from "@/server/plan";
import { inviteMember, listMembers } from "@/server/team";
import { toApiError } from "@/lib/api-errors";

/** GET /api/team -> workspace members (Enterprise feature, Build Spec §10). */
export function GET() {
  try {
    assertEnterprise();
    return NextResponse.json({ members: listMembers() });
  } catch (err) {
    return toApiError(err);
  }
}

const inviteSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("A valid email is required."),
  role: z.enum(["admin", "member"]),
});

/** POST /api/team -> invite a member (Enterprise + admin/owner role). */
export async function POST(req: Request) {
  try {
    assertEnterprise();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json({ member: inviteMember(parsed.data) }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
