import { NextResponse } from "next/server";
import { z } from "zod";
import { assertEnterprise } from "@/server/plan";
import { assertRole } from "@/server/auth-context";
import { issueKey, listKeys } from "@/server/apikeys";
import { toApiError } from "@/lib/api-errors";

/** GET /api/keys -> the workspace's API keys, masked (Enterprise + admin). */
export function GET() {
  try {
    assertEnterprise();
    assertRole("admin");
    return NextResponse.json({ keys: listKeys() });
  } catch (err) {
    return toApiError(err);
  }
}

const schema = z.object({ name: z.string().trim().min(1, "Name is required.") });

/**
 * POST /api/keys -> issue a new key. The raw token is returned ONCE here and is
 * never recoverable afterwards (Enterprise + admin).
 */
export async function POST(req: Request) {
  try {
    assertEnterprise();
    assertRole("admin");
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { key, token } = await issueKey(parsed.data.name);
    return NextResponse.json({ key, token }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
