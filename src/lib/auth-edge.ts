import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Edge-safe Auth.js instance for the middleware. Uses only `auth.config.ts`
 * (no Credentials provider, no Node-only deps) so it can run in the edge
 * runtime to decode the session and gate routes.
 */
export const { auth } = NextAuth(authConfig);
