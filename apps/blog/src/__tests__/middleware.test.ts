/**
 * Integration tests for the Next.js middleware — auth guard (#539)
 *
 * Uses the real `better-auth/cookies` module (no mock). The session-cookie
 * check is pure header parsing, so it works without a database or network.
 * `next/server` is shimmed because we're not in the Edge runtime.
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";

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
    next: () => new Response(null, { status: 200 }),
  },
}));

// Dynamic import after mock registration
const { middleware } = await import("../middleware");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MinimalRequest {
  headers: Headers;
  url: string;
}

const makeRequest = (path: string, cookie?: string): MinimalRequest => {
  const headers = new Headers();
  if (cookie) {
    headers.set("Cookie", cookie);
  }
  return { url: `http://localhost:3000${path}`, headers };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("middleware — /profile auth guard (#539)", () => {
  beforeEach(() => {
    // no shared state to reset
  });

  // ── (a) unauthenticated /profile → 307 redirect ───────────────────────────

  it("(a) unauthenticated /profile → 307 redirect to /login?callbackURL=%2Fprofile", async () => {
    const res = await middleware(makeRequest("/profile") as never);

    expect(res.status).toBe(307);
    const location = res.headers.get("Location") ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("callbackURL=%2Fprofile");
  });

  // ── (b) unauthenticated /profile/resume/add → redirect with encoded path ──

  it("(b) unauthenticated /profile/resume/add → 307 redirect with encoded callbackURL", async () => {
    const res = await middleware(makeRequest("/profile/resume/add") as never);

    expect(res.status).toBe(307);
    const location = res.headers.get("Location") ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("callbackURL=%2Fprofile%2Fresume%2Fadd");
  });

  // ── (c) valid session cookie passes through ────────────────────────────────

  it("(c) request with valid Better Auth session cookie passes through (200)", async () => {
    const req = makeRequest(
      "/profile/resume/add",
      "better-auth.session_token=valid-token-abc"
    );
    const res = await middleware(req as never);

    // NextResponse.next() → 200 in the shim
    expect(res.status).toBe(200);
  });
});
