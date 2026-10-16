/**
 * Fixed-window rate limiter, keyed by client (usually IP address).
 *
 * The default store is in memory, so on Vercel each server instance counts
 * separately: a determined client spread across instances gets more than the
 * limit. That's acceptable as a first guard against accidental floods and
 * cheap abuse. Once a shared store exists (Redis, e.g. Upstash), implement
 * RateLimitStore against it and pass it in; callers don't change.
 */

export interface RateLimitStore {
  /** Adds one hit for `key` in the window starting at `windowStart` and returns the new count. */
  increment(key: string, windowStart: number, windowMs: number): number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the current window resets. */
  retryAfterSeconds: number;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private hits = new Map<string, { windowStart: number; count: number }>();
  private lastSweep = 0;

  increment(key: string, windowStart: number, windowMs: number): number {
    // Drop expired entries at most once per window so the map can't grow without bound.
    if (windowStart - this.lastSweep >= windowMs) {
      for (const [k, v] of this.hits) if (v.windowStart < windowStart) this.hits.delete(k);
      this.lastSweep = windowStart;
    }
    const entry = this.hits.get(key);
    if (!entry || entry.windowStart !== windowStart) {
      this.hits.set(key, { windowStart, count: 1 });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }
}

export function createRateLimiter(opts: { limit: number; windowMs: number; store?: RateLimitStore; now?: () => number }) {
  const store = opts.store ?? new MemoryRateLimitStore();
  const now = opts.now ?? Date.now;

  return function check(key: string): RateLimitResult {
    const t = now();
    const windowStart = Math.floor(t / opts.windowMs) * opts.windowMs;
    const count = store.increment(key, windowStart, opts.windowMs);
    return {
      allowed: count <= opts.limit,
      limit: opts.limit,
      remaining: Math.max(0, opts.limit - count),
      retryAfterSeconds: Math.max(1, Math.ceil((windowStart + opts.windowMs - t) / 1000)),
    };
  };
}

/** Best-effort client identifier from proxy headers. Vercel sets x-forwarded-for. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
