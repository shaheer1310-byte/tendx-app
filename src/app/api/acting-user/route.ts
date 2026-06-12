import { NextResponse } from "next/server";
import { z } from "zod";
import { USER_COOKIE } from "@/server/auth-context";
import { store } from "@/server/store";

/**
 * Demo "acting as" switcher. Sets a cookie the server-side RBAC context reads
 * (server/auth-context.ts), so role-based access can be exercised without a
 * full auth flow. In production the role comes from the Auth.js session.
 */
const schema = z.object({ userId: z.string().min(1) });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  }
  const user = store.users.find(
    (u) => u.id === parsed.data.userId && u.status === "active",
  );
  if (!user) {
    return NextResponse.json({ error: "Unknown user." }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, userId: user.id, role: user.role });
  res.cookies.set(USER_COOKIE, user.id, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
