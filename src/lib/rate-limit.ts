/**
 * Minimal fixed-window rate limiter for the public API (Build Spec section 8
 * mentions rate limiting on the scale-up path). In-memory and per-process here;
 * in production this moves to a shared store (e.g. Redis/Upstash) so limits hold
 * across instances. Kept on globalThis so it survives dev HMR.
 */
interface Window {
  count: number;
  resetAt: number;
}

const globalForRl = globalThis as unknown as {
  tendxRateLimit: Map<string, Window> | undefined;
};

const buckets =
  globalForRl.tendxRateLimit ?? (globalForRl.tendxRateLimit = new Map());

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets. */
  resetSeconds: number;
}

export function rateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, limit, remaining: limit - 1, resetSeconds: windowMs / 1000 };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  const resetSeconds = Math.ceil((existing.resetAt - now) / 1000);
  return { ok: existing.count <= limit, limit, remaining, resetSeconds };
}
