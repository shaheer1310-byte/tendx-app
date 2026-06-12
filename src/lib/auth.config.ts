import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (Build Spec section 3). Holds everything the
 * middleware needs to decode the JWT session — session strategy, pages and the
 * jwt/session callbacks that carry the TendX role + companyId. The Credentials
 * provider (which hashes passwords and reads the store, both Node-only) is added
 * separately in `auth.ts` so it never gets bundled into the edge middleware.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.companyId = user.companyId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role;
        session.user.companyId = token.companyId;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
