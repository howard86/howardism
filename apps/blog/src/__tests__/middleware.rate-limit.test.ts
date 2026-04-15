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

const { middleware } = await import("../middleware");

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
    expect(body).toEqual({ error: "rate_limited" });
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
