import { beforeEach, describe, expect, it, mock } from "bun:test";

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
// Types
// ---------------------------------------------------------------------------
type SessionResult =
  | { ok: true; session: typeof fakeSession }
  | { ok: false; response: Response };

/** Minimal fetch signature — avoids Bun-specific `preconnect` on `typeof fetch` */
type MockFetch = (
  url: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

// ---------------------------------------------------------------------------
// Module mocks — must be registered before dynamic import of route.ts
// ---------------------------------------------------------------------------

const mockRequireSessionForRoute = mock(
  (): Promise<SessionResult> =>
    Promise.resolve({ ok: true as const, session: fakeSession })
);

mock.module("@/lib/auth", () => ({
  requireSessionForRoute: mockRequireSessionForRoute,
}));

// Default: resolve4 → public IP; resolve6 → ENOTFOUND (no addresses)
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

// Dynamic import after all mocks are registered
const { GET } = await import("./route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRequest = (urlParam: string) =>
  ({
    url: `http://localhost:3000/api/proxy?url=${encodeURIComponent(urlParam)}`,
  }) as Request;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/proxy", () => {
  let currentFetchImpl: MockFetch;

  beforeEach(() => {
    mockRequireSessionForRoute.mockImplementation(
      (): Promise<SessionResult> =>
        Promise.resolve({ ok: true as const, session: fakeSession })
    );
    mockResolve4.mockImplementation((_hostname: string) =>
      Promise.resolve(["8.8.8.8"] as string[])
    );
    mockResolve6.mockImplementation((_hostname: string): Promise<string[]> => {
      const err = Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" });
      return Promise.reject(err);
    });

    // Default fetch: returns a small ok response
    currentFetchImpl = () =>
      Promise.resolve(
        new Response("hello world", {
          status: 200,
          headers: { "content-type": "text/html" },
        })
      );
    global.fetch = currentFetchImpl as unknown as typeof fetch;
  });

  // ── Auth guard ────────────────────────────────────────────────────────────

  it("returns 401 when unauthenticated (no URL parse, DNS, or fetch)", async () => {
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
    currentFetchImpl = () => {
      fetchCalled = true;
      return Promise.resolve(new Response("", { status: 200 }));
    };
    global.fetch = currentFetchImpl as unknown as typeof fetch;

    const res = await GET(
      makeRequest("https://example.com") as import("next/server").NextRequest
    );
    expect(res.status).toBe(401);
    expect(fetchCalled).toBe(false);
  });

  // ── DNS private-IP guard ──────────────────────────────────────────────────

  it("returns 400 when resolve4 returns a private IP (no fetch)", async () => {
    mockResolve4.mockImplementationOnce((_hostname: string) =>
      Promise.resolve(["127.0.0.1"] as string[])
    );

    let fetchCalled = false;
    currentFetchImpl = () => {
      fetchCalled = true;
      return Promise.resolve(new Response("", { status: 200 }));
    };
    global.fetch = currentFetchImpl as unknown as typeof fetch;

    const res = await GET(
      makeRequest("https://example.com") as import("next/server").NextRequest
    );
    expect(res.status).toBe(400);
    expect(fetchCalled).toBe(false);
  });

  it("proceeds to fetch when resolve4 returns a public IP", async () => {
    mockResolve4.mockImplementationOnce((_hostname: string) =>
      Promise.resolve(["8.8.8.8"] as string[])
    );

    let fetchCalled = false;
    currentFetchImpl = (_url, _opts) => {
      fetchCalled = true;
      return Promise.resolve(new Response("page content", { status: 200 }));
    };
    global.fetch = currentFetchImpl as unknown as typeof fetch;

    const res = await GET(
      makeRequest("https://example.com") as import("next/server").NextRequest
    );
    expect(fetchCalled).toBe(true);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: "page content" });
  });

  // ── Fetch timeout guard ───────────────────────────────────────────────────

  it("returns 504 when fetch rejects with AbortError (simulates 5s timeout)", async () => {
    const abortError = Object.assign(new Error("The operation was aborted"), {
      name: "AbortError",
    });
    currentFetchImpl = () => Promise.reject(abortError);
    global.fetch = currentFetchImpl as unknown as typeof fetch;

    const res = await GET(
      makeRequest("https://example.com") as import("next/server").NextRequest
    );
    expect(res.status).toBe(504);
  });

  // ── Response size cap — Content-Length header ─────────────────────────────

  it("returns 413 when Content-Length exceeds 1MB without reading body", async () => {
    let getReaderCalled = false;

    // Use a plain mock object to track whether getReader was invoked
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

    currentFetchImpl = () =>
      Promise.resolve(mockResponse as unknown as Response);
    global.fetch = currentFetchImpl as unknown as typeof fetch;

    const res = await GET(
      makeRequest("https://example.com") as import("next/server").NextRequest
    );
    expect(res.status).toBe(413);
    expect(getReaderCalled).toBe(false);
  });

  // ── Response size cap — streaming body ───────────────────────────────────

  it("returns 413 when streamed body exceeds 1MB cap", async () => {
    // 1_000_001 bytes — just over the cap
    const bigChunk = new Uint8Array(1_000_001).fill(65); // 'A'
    currentFetchImpl = () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(bigChunk);
          controller.close();
        },
      });
      return Promise.resolve(new Response(stream, { status: 200 }));
    };
    global.fetch = currentFetchImpl as unknown as typeof fetch;

    const res = await GET(
      makeRequest("https://example.com") as import("next/server").NextRequest
    );
    expect(res.status).toBe(413);
  });
});
