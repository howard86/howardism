/**
 * Integration tests for the per-route in-memory rate limiter (#497)
 *
 * Each test uses a distinct IP address from the TEST-NET-1 range (192.0.2.x)
 * so rate-limit state from one test does not bleed into another.
 *
 * The `next/server` module is shimmed (same pattern as middleware.test.ts).
 * The `better-auth/cookies` module is NOT mocked — same real module.
 */

import { describe, expect, it, mock } from "bun:test";

// ---------------------------------------------------------------------------
// Shim next/server — not available outside the Next.js Edge runtime
// ---------------------------------------------------------------------------
mock.module("next/server", () => ({
  NextResponse: {
    redirect: (url: URL | string, status?: number | ResponseInit) => {
      const statusCode =
        typeof status === "number"
          ? status
          : ((status as ResponseInit | undefined)?.status ?? 307);
      return new Response(null, {
        status: statusCode,
        headers: { Location: url.toString() },
      });
    },
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        ...init,
        headers: {
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
      }),
    next: () => new Response(null, { status: 200 }),
  },
}));

const mod = (await import("../middleware")) as any;
const { middleware } = mod;
const BUCKET_MAP_CAP: number | undefined = mod.BUCKET_MAP_CAP;
const buckets:
  | Map<string, { count: number; windowStart: number; windowMs: number }>
  | undefined = mod.buckets;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MinimalRequest {
  headers: Headers;
  url: string;
}

const makeApiRequest = (
  path: string,
  ip: string,
  cookie?: string
): MinimalRequest => {
  const headers = new Headers({ "x-forwarded-for": ip });
  if (cookie) {
    headers.set("Cookie", cookie);
  }
  return { url: `http://localhost:3000${path}`, headers };
};

const exhaust = async (
  path: string,
  ip: string,
  count: number
): Promise<void> => {
  for (let i = 0; i < count; i++) {
    await middleware(makeApiRequest(path, ip) as never);
  }
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("middleware — per-route rate limiting (#497)", () => {
  // ── (a) /api/subscription: 5/60s → 6th request returns 429 ───────────────

  it("(a) 6th request within 60s to /api/subscription returns 429", async () => {
    const ip = "192.0.2.1";
    await exhaust("/api/subscription", ip, 5);

    const res = await middleware(
      makeApiRequest("/api/subscription", ip) as never
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body).toEqual({ message: "Too many requests" });
  });

  // ── (b) /api/auth: 10/60s → 11th request returns 429 ────────────────────

  it("(b) 11th request within 60s to /api/auth/sign-in/email returns 429", async () => {
    const ip = "192.0.2.2";
    await exhaust("/api/auth/sign-in/email", ip, 10);

    const res = await middleware(
      makeApiRequest("/api/auth/sign-in/email", ip) as never
    );
    expect(res.status).toBe(429);
  });

  // ── (c) /api/sudoku: 20/60s → 21st request returns 429 ──────────────────

  it("(c) 21st request within 60s to /api/sudoku returns 429", async () => {
    const ip = "192.0.2.3";
    await exhaust("/api/sudoku", ip, 20);

    const res = await middleware(makeApiRequest("/api/sudoku", ip) as never);
    expect(res.status).toBe(429);
  });

  // ── (d) 429 responses carry Retry-After header ────────────────────────────

  it("(d) 429 response carries a Retry-After header", async () => {
    const ip = "192.0.2.4";
    await exhaust("/api/subscription", ip, 5);

    const res = await middleware(
      makeApiRequest("/api/subscription", ip) as never
    );
    expect(res.status).toBe(429);
    const retryAfter = res.headers.get("Retry-After");
    expect(retryAfter).not.toBeNull();
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });

  // ── (e) unmatched /api/anything falls back to 60/60s ─────────────────────

  it("(e) unmatched /api/anything falls back to 60/60s limit", async () => {
    const ip = "192.0.2.5";
    await exhaust("/api/something-unmatched", ip, 60);

    const res = await middleware(
      makeApiRequest("/api/something-unmatched", ip) as never
    );
    expect(res.status).toBe(429);
  });

  // ── auth gate ordering: /profile/* redirect does NOT consume rate-limit slot

  it("auth gate runs before rate limit: /profile redirect does not consume rate-limit capacity", async () => {
    const ip = "192.0.2.6";
    // Send many unauthenticated profile requests (no cookie)
    for (let i = 0; i < 10; i++) {
      const res = await middleware(
        makeApiRequest("/profile/anything", ip) as never
      );
      // Each is a redirect, not a rate-limited response
      expect(res.status).toBe(307);
    }

    // API capacity for this IP is still untouched — can still make 5 requests
    for (let i = 0; i < 5; i++) {
      const res = await middleware(
        makeApiRequest("/api/subscription", ip) as never
      );
      expect(res.status).toBe(200);
    }

    // 6th API request is now limited
    const res = await middleware(
      makeApiRequest("/api/subscription", ip) as never
    );
    expect(res.status).toBe(429);
  });
});

// ---------------------------------------------------------------------------
// Hardening tests — #554
// ---------------------------------------------------------------------------

describe("middleware — rate-limiter hardening (#554)", () => {
  // ── §5.1 Left-most XFF extraction prevents suffix-injection bypass ──────────

  it("§5.1 suffix-injected XFF maps to same bucket as plain IP (no bypass)", async () => {
    const realIp = "192.0.2.100";
    // Exhaust limit with a plain single-IP XFF header
    await exhaust("/api/subscription", realIp, 5);

    // Attacker appends fake proxies — left-most is still realIp
    const bypassAttempt = makeApiRequest(
      "/api/subscription",
      `${realIp}, 10.0.0.1, 172.16.0.1`
    );
    const res = await middleware(bypassAttempt as never);
    // Must hit the same exhausted bucket → 429
    expect(res.status).toBe(429);
  });

  it("§5.1b different left-most XFF IP creates a distinct bucket", async () => {
    const exhaustedIp = "192.0.2.101";
    const freshIp = "203.0.113.10";
    await exhaust("/api/subscription", exhaustedIp, 5);

    // Fresh client happens to pass through the exhausted proxy
    const req = makeApiRequest(
      "/api/subscription",
      `${freshIp}, ${exhaustedIp}`
    );
    const res = await middleware(req as never);
    // Left-most is freshIp — separate, non-exhausted bucket → allowed
    expect(res.status).toBe(200);
  });

  // ── §5.2 429 body is JSON {message: "Too many requests"} ──────────────────

  it("§5.2 429 response body is {message: 'Too many requests'} with JSON content-type", async () => {
    const ip = "192.0.2.102";
    await exhaust("/api/subscription", ip, 5);
    const res = await middleware(
      makeApiRequest("/api/subscription", ip) as never
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body).toEqual({ message: "Too many requests" });
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  // ── §5.3 Bounded bucket map: on-write eviction sweeps expired entries ───────

  it("§5.3 on-write eviction sweeps expired entries when bucket count exceeds BUCKET_MAP_CAP", async () => {
    if (buckets === undefined || BUCKET_MAP_CAP === undefined) {
      throw new Error(
        "BUCKET_MAP_CAP and buckets must be exported from middleware.ts for this test"
      );
    }

    const testKeyPrefix = "__eviction-test-";

    // Pack the map with expired entries (windowStart = 0, expired long ago)
    for (let i = 0; i < BUCKET_MAP_CAP + 50; i++) {
      buckets.set(`${testKeyPrefix}${i}`, {
        count: 1,
        windowStart: 0,
        windowMs: 60_000,
      });
    }
    expect(buckets.size).toBeGreaterThan(BUCKET_MAP_CAP);

    // Trigger on-write eviction by making a new request from a fresh IP
    await middleware(
      makeApiRequest("/api/subscription", "10.20.30.40") as never
    );

    // Expired entries swept — map size back within bound
    expect(buckets.size).toBeLessThanOrEqual(BUCKET_MAP_CAP);

    // Cleanup any surviving test keys
    for (const key of [...buckets.keys()]) {
      if (key.startsWith(testKeyPrefix)) {
        buckets.delete(key);
      }
    }
  });

  // ── §5.4 BUCKET_MAP_CAP exported >= 10_000; no global timers ───────────────

  it("§5.4 BUCKET_MAP_CAP is exported and >= 10_000", () => {
    if (BUCKET_MAP_CAP === undefined) {
      throw new Error("BUCKET_MAP_CAP must be exported from middleware.ts");
    }
    expect(BUCKET_MAP_CAP).toBeGreaterThanOrEqual(10_000);
  });
});
