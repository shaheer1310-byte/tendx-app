import { NextResponse } from "next/server";
import { z } from "zod";
import { PLAN_COOKIE } from "@/server/plan";

/**
 * Demo plan switcher. Sets a cookie that the server-side plan gate reads, so
 * Free vs Professional gating can be exercised without billing. In production
 * the plan comes from the company's subscription row (Phase 4).
 */
const schema = z.object({
  plan: z.enum(["free", "professional", "enterprise"]),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, plan: parsed.data.plan });
  res.cookies.set(PLAN_COOKIE, parsed.data.plan, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
