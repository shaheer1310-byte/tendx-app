import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/server/apikeys";
import { rateLimit } from "@/lib/rate-limit";
import type { CompanyProfile } from "@/server/types";

const RATE_LIMIT = 60; // requests per minute per key

/** Pull the bearer token from `Authorization` or the `x-api-key` header. */
function readToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return req.headers.get("x-api-key");
}

/**
 * Guard for `/api/v1/*` (the Enterprise public API, Build Spec sections 8 and
 * 10). Authenticates the API key and applies per-key rate limiting. Returns the
 * authenticated company, or a ready-to-return error response (401 / 429).
 */
export function guardPublicApi(
  req: Request,
):
  | { company: CompanyProfile; headers: Record<string, string> }
  | { error: NextResponse } {
  const token = readToken(req);
  const company = authenticateApiKey(token);
  if (!company) {
    return {
      error: NextResponse.json(
        {
          error:
            "Missing or invalid API key. Pass it as 'Authorization: Bearer <token>' or the 'x-api-key' header.",
        },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
      ),
    };
  }

  const limit = rateLimit(`apikey:${token}`, RATE_LIMIT);
  const headers = {
    "X-RateLimit-Limit": String(limit.limit),
    "X-RateLimit-Remaining": String(limit.remaining),
  };
  if (!limit.ok) {
    return {
      error: NextResponse.json(
        { error: "Rate limit exceeded." },
        {
          status: 429,
          headers: { ...headers, "Retry-After": String(limit.resetSeconds) },
        },
      ),
    };
  }

  return { company, headers };
}
