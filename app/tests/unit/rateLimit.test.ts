import { describe, expect, it } from "vitest";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

describe("createRateLimiter", () => {
  it("allows up to the limit in a window, then blocks", () => {
    let t = 0;
    const check = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => t });
    expect([check("a"), check("a"), check("a")].every((r) => r.allowed)).toBe(true);
    const blocked = check("a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    t = 30_000;
    expect(check("a").retryAfterSeconds).toBe(30);
  });

  it("resets in the next window", () => {
    let t = 0;
    const check = createRateLimiter({ limit: 1, windowMs: 1_000, now: () => t });
    check("a");
    expect(check("a").allowed).toBe(false);
    t = 1_000;
    expect(check("a").allowed).toBe(true);
  });

  it("counts clients separately", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => 0 });
    expect(check("a").allowed).toBe(true);
    expect(check("b").allowed).toBe(true);
    expect(check("a").allowed).toBe(false);
  });
});

describe("clientKey", () => {
  it("uses the first x-forwarded-for address", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(clientKey(new Headers({ "x-real-ip": "198.51.100.7" }))).toBe("198.51.100.7");
    expect(clientKey(new Headers())).toBe("unknown");
  });
});
