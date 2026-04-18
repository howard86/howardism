import { describe, expect, it } from "bun:test";

import { createMemoryRateLimiter } from "../memory";

const policy = { prefix: "/api/test", limit: 3, windowMs: 60_000 };

describe("createMemoryRateLimiter", () => {
  it("allows up to `limit` consumes inside the window", async () => {
    const limiter = createMemoryRateLimiter();
    for (let i = 0; i < 3; i++) {
      const res = await limiter.consume("ip-a", policy);
      expect(res.allowed).toBe(true);
      expect(res.retryAfter).toBe(0);
    }
  });

  it("returns allowed=false with a positive retryAfter on overflow", async () => {
    const limiter = createMemoryRateLimiter();
    for (let i = 0; i < 3; i++) {
      await limiter.consume("ip-b", policy);
    }
    const res = await limiter.consume("ip-b", policy);
    expect(res.allowed).toBe(false);
    expect(res.retryAfter).toBeGreaterThan(0);
    expect(res.retryAfter).toBeLessThanOrEqual(60);
  });

  it("keeps buckets isolated by key", async () => {
    const limiter = createMemoryRateLimiter();
    await limiter.consume("ip-c", policy);
    await limiter.consume("ip-c", policy);
    await limiter.consume("ip-c", policy);

    // ip-d starts fresh — first three should all be allowed.
    for (let i = 0; i < 3; i++) {
      const res = await limiter.consume("ip-d", policy);
      expect(res.allowed).toBe(true);
    }
  });

  it("rolls over to a fresh window once windowMs elapses", async () => {
    const limiter = createMemoryRateLimiter();
    const shortPolicy = { prefix: "/api/short", limit: 1, windowMs: 50 };
    const first = await limiter.consume("ip-e", shortPolicy);
    expect(first.allowed).toBe(true);

    const second = await limiter.consume("ip-e", shortPolicy);
    expect(second.allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 80));

    const third = await limiter.consume("ip-e", shortPolicy);
    expect(third.allowed).toBe(true);
  });
});
