import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-edge";

/**
 * Route protection (Build Spec section 10). The authenticated app shell is
 * gated: visiting any shell route while logged out redirects to /login, and
 * visiting /login or /signup while logged in redirects to /dashboard. The
 * landing page (/) and the auth pages are the only public routes.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/tenders",
  "/analyze",
  "/bids",
  "/suppliers",
  "/tax",
  "/analytics",
  "/settings",
  "/onboarding",
];

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const loggedIn = !!req.auth;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  const onAuthPage = path === "/login" || path === "/signup";

  if (isProtected && !loggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }
  if (onAuthPage && loggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  return NextResponse.next();
});

// Run on everything except API routes (they self-gate) and static assets.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
