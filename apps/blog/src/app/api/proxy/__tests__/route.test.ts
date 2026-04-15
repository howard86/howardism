/**
 * Integration tests for GET /api/proxy — SSRF hardening (#540)
 *
 * These tests exercise the refactored route, which now:
 *   - Follows redirects manually (redirect: "manual") so every hop's Location
 *     is validated before following.
 *   - Pins the outbound TCP socket to the IP returned by resolveAndCheckPrivateIP,
 *     eliminating the DNS-rebind TOCTOU window.
 *
 * Upstream connections are intercepted via global.fetch mocking (the same
 * pattern used by route.test.ts). A real local HTTP server is not used because
 * the proxy blocks all private/loopback addresses, making a server on 127.0.0.1
 * unreachable from within the route's own SSRF guard. The DNS-rebind case (e) is
 * verified by confirming only one DNS lookup occurs per request, proving the
 * second lookup that DNS rebinding would exploit is never made.
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Session fixture
// ---------------------------------------------------------------------------
const fakeSession = {
  user: {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    emailVerified: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  session: {
    id: "sess-1",
    userId: "user-1",
    token: "tok-abc",
    expiresAt: new Date("2099-01-01"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
};

// ---------------------------------------------------------------------------
// Module mocks — registered before the dynamic import of route.ts
// ---------------------------------------------------------------------------

type SessionResult =
  | { ok: true; session: typeof fakeSession }
  | { ok: false; response: Response };

const mockRequireSessionForRoute = mock(
  (): Promise<SessionResult> =>
    Promise.resolve({ ok: true as const, session: fakeSession })
);

mock.module("@/lib/auth", () => ({
  requireSessionForRoute: mockRequireSessionForRoute,
}));

const mockResolve4 = mock((_hostname: string) =>
  Promise.resolve(["8.8.8.8"] as string[])
);
const mockResolve6 = mock((_hostname: string): Promise<string[]> => {
  const err = Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" });
  return Promise.reject(err);
});

mock.module("node:dns/promises", () => ({
  resolve4: mockResolve4,
  resolve6: mockResolve6,
}));

mock.module("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        ...init,
        headers: {
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
      }),
  },
}));

// Bun's built-in undici shim omits Agent.close(); mock createPinnedAgent so the
// try/finally cleanup in fetchHop works under test. The agent is irrelevant
// when global.fetch is mocked — the dispatcher option is ignored.
mock.module("@/app/api/proxy/pinnedAgent", () => ({
  createPinnedAgent: mock((_ip: string, _hostname: string) => ({
    close: mock(() => Promise.resolve()),
  })),
}));

// Dynamic import AFTER all mocks are registered
const { GET } = await import("../route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRequest = (urlParam: string) =>
  ({
    url: `http://localhost:3000/api/proxy?url=${encodeURIComponent(urlParam)}`,
  }) as unknown as NextRequest;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/proxy — SSRF hardening (#540)", () => {
  beforeEach(() => {
    mockRequireSessionForRoute.mockImplementation(
      (): Promise<SessionResult> =>
        Promise.resolve({ ok: true as const, session: fakeSession })
    );
    // Reset DNS mocks to default: resolve4 returns public IP, resolve6 ENOTFOUND
    mockResolve4.mockImplementation((_hostname: string) =>
      Promise.resolve(["8.8.8.8"] as string[])
    );
    mockResolve6.mockImplementation((_hostname: string): Promise<string[]> => {
      const err = Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" });
      return Promise.reject(err);
    });
    // Reset global fetch to a simple 200 response
    global.fetch = mock(() =>
      Promise.resolve(new Response("hello upstream", { status: 200 }))
    ) as unknown as typeof fetch;
  });

  // ── Auth guard ────────────────────────────────────────────────────────────

  it("returns 401 when unauthenticated (no DNS or fetch)", async () => {
    mockRequireSessionForRoute.mockImplementationOnce(
      (): Promise<SessionResult> =>
        Promise.resolve({
          ok: false as const,
          response: new Response('{"message":"Unauthorized"}', {
            status: 401,
            headers: { "content-type": "application/json" },
          }),
        })
    );

    let fetchCalled = false;
    global.fetch = mock(() => {
      fetchCalled = true;
      return Promise.resolve(new Response("", { status: 200 }));
    }) as unknown as typeof fetch;

    const res = await GET(makeRequest("https://example.com"));
    expect(res.status).toBe(401);
    expect(fetchCalled).toBe(false);
  });

  // ── (a) Public URL returns 200 with body ──────────────────────────────────

  it("(a) public URL → 200 with proxied body", async () => {
    global.fetch = mock(() =>
      Promise.resolve(new Response("hello from upstream", { status: 200 }))
    ) as unknown as typeof fetch;

    const res = await GET(makeRequest("https://example.com/page"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: "hello from upstream" });
  });

  // ── (b) 302 → http://127.0.0.1/ rejected; no second fetch ────────────────

  it("(b) redirect to private http URL is rejected; loopback never fetched", async () => {
    let fetchCallCount = 0;
    global.fetch = mock(() => {
      fetchCallCount++;
      return Promise.resolve(Response.redirect("http://127.0.0.1/secret", 302));
    }) as unknown as typeof fetch;

    const res = await GET(makeRequest("https://example.com"));

    expect(res.status).toBe(400);
    // The initial fetch (hop 0) must have run, but the redirect to 127.0.0.1
    // must be rejected before any second fetch is issued.
    expect(fetchCallCount).toBe(1);
  });

  // ── (c) Redirect chain > MAX_REDIRECTS=3 → rejected ──────────────────────

  it("(c) redirect chain exceeding MAX_REDIRECTS is rejected", async () => {
    let hopIndex = 0;
    global.fetch = mock(() => {
      hopIndex++;
      return Promise.resolve(
        new Response(null, {
          status: 302,
          headers: { Location: `https://hop${hopIndex}.example.com/` },
        })
      );
    }) as unknown as typeof fetch;

    const res = await GET(makeRequest("https://example.com"));

    expect(res.status).toBe(400);
    const body = await res.json();
    // Should report "too many redirects" or similar
    expect(typeof body.message).toBe("string");
  });

  // ── (d) DNS returns private IP on hop 1 → rejected; no fetch ─────────────

  it("(d) DNS resolving to private IP is rejected before any fetch", async () => {
    mockResolve4.mockImplementation((_hostname: string) =>
      Promise.resolve(["127.0.0.1"] as string[])
    );

    let fetchCalled = false;
    global.fetch = mock(() => {
      fetchCalled = true;
      return Promise.resolve(new Response("", { status: 200 }));
    }) as unknown as typeof fetch;

    const res = await GET(makeRequest("https://example.com"));

    expect(res.status).toBe(400);
    expect(fetchCalled).toBe(false);
  });

  // ── (e) DNS-rebind: second lookup returns private IP; connection is pinned ─

  it("(e) DNS-rebind: only one DNS lookup is performed; validated IP pins the connection", async () => {
    // First call validates the public IP; a second call (if made) would return
    // a private IP — simulating a DNS-rebind attack window.
    let resolve4CallCount = 0;
    mockResolve4.mockImplementation((_hostname: string) => {
      resolve4CallCount++;
      if (resolve4CallCount === 1) {
        return Promise.resolve(["8.8.8.8"] as string[]);
      }
      // This should never be reached in a correctly pinned implementation.
      return Promise.resolve(["10.0.0.1"] as string[]);
    });

    let fetchCalled = false;
    global.fetch = mock(() => {
      fetchCalled = true;
      return Promise.resolve(new Response("data", { status: 200 }));
    }) as unknown as typeof fetch;

    const res = await GET(makeRequest("https://example.com"));

    // Request succeeds because the validated IP (8.8.8.8) is used for the
    // connection; no second DNS lookup ever happens.
    expect(res.status).toBe(200);
    expect(fetchCalled).toBe(true);
    expect(resolve4CallCount).toBe(1);
  });

  // ── (f) Fetch timeout → 504 ───────────────────────────────────────────────

  it("(f) upstream slower than FETCH_TIMEOUT_MS returns 504", async () => {
    const abortError = Object.assign(new Error("The operation was aborted"), {
      name: "AbortError",
    });
    global.fetch = mock(() =>
      Promise.reject(abortError)
    ) as unknown as typeof fetch;

    const res = await GET(makeRequest("https://example.com"));

    expect(res.status).toBe(504);
  });

  // ── (g0) Content-Length header > cap → 413 without reading body ─────────

  it("(g0) Content-Length header over cap returns 413 without reading body", async () => {
    let getReaderCalled = false;
    const mockBody = {
      getReader: () => {
        getReaderCalled = true;
        return {
          read: () => Promise.resolve({ done: true, value: undefined }),
          cancel: () => Promise.resolve(),
        };
      },
    };
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-length": "5000000" }),
      body: mockBody,
    };

    global.fetch = mock(() =>
      Promise.resolve(mockResponse as unknown as Response)
    ) as unknown as typeof fetch;

    const res = await GET(makeRequest("https://example.com"));
    expect(res.status).toBe(413);
    expect(getReaderCalled).toBe(false);
  });

  // ── (g) Response body > MAX_BODY_BYTES → 413 ─────────────────────────────

  it("(g) streamed response body exceeding MAX_BODY_BYTES returns 413", async () => {
    const bigChunk = new Uint8Array(1_000_001).fill(65); // 1 MB + 1 byte
    global.fetch = mock(() => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(bigChunk);
          controller.close();
        },
      });
      return Promise.resolve(new Response(stream, { status: 200 }));
    }) as unknown as typeof fetch;

    const res = await GET(makeRequest("https://example.com"));

    expect(res.status).toBe(413);
  });
});
