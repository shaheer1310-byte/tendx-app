import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { findAccountByEmail } from "@/server/store";

/**
 * Auth.js (NextAuth v5) config (Build Spec section 3).
 * Email + password credentials, JWT sessions, role carried on the token.
 * Roles: owner | member | admin (Build Spec section 7.1).
 *
 * Identity resolution is dual so the SAME build runs both locally and on
 * serverless:
 *  - Postgres (Prisma/Neon) FIRST when a DB is reachable — required in
 *    production, where the in-memory store does not persist across instances.
 *  - The in-memory store (`server/store.ts`) as a fallback, so the app still
 *    runs locally with no database.
 * Sessions are JWTs, so once issued they validate on any instance with no DB
 * round-trip (works regardless of serverless cold starts).
 */
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface AuthedUser {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  companyId: string | null;
}

async function authenticate(
  email: string,
  password: string,
): Promise<AuthedUser | null> {
  // 1) Database (production / Neon). Lazily imported so the in-memory-only
  //    local path never needs the Prisma client at module load.
  try {
    const { prisma } = await import("./prisma");
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      };
    }
    // Not in the DB: fall through to the in-memory store (demo account).
  } catch {
    // DB unreachable (local, no Postgres): fall back to the in-memory store.
  }

  // 2) In-memory store fallback.
  const account = findAccountByEmail(email);
  if (!account) return null;
  const ok = await bcrypt.compare(password, account.passwordHash);
  if (!ok) return null;
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    companyId: account.companyId,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        return authenticate(parsed.data.email, parsed.data.password);
      },
    }),
  ],
});
