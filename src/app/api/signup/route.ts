import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAccount, findAccountByEmail } from "@/server/store";

// Server-side validation on every API input (Build Spec section 13).
const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, password, companyName } = parsed.data;

  // 1) Persist to Postgres (production / Neon) so the account survives across
  //    serverless instances. The first user of a new company is its owner.
  try {
    const { prisma } = await import("@/lib/prisma");
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const company = await prisma.company.create({
      data: {
        legalName: companyName,
        subscriptions: { create: { plan: "free" } },
        users: { create: { name, email, passwordHash, role: "owner" } },
      },
    });
    return NextResponse.json(
      { ok: true, companyId: company.id },
      { status: 201 },
    );
  } catch {
    // 2) DB unreachable (local, no Postgres): create the account in the
    //    in-memory store instead, provisioning its demo dataset (Build Spec §11).
    if (findAccountByEmail(email)) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
    const account = await createAccount(parsed.data);
    return NextResponse.json(
      { ok: true, companyId: account.companyId },
      { status: 201 },
    );
  }
}
