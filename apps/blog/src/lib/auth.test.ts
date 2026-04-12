import { beforeEach, describe, expect, it, mock } from "bun:test";

// ---------------------------------------------------------------------------
// IMPORTANT: Bun does NOT hoist mock.module() calls like Jest does.
// Static `import` statements are resolved before any user code runs, so we
// must use a dynamic import() for the module under test — see the bottom of
// this preamble block.
// ---------------------------------------------------------------------------

// --- fake session fixture (defined first so nextSession can reference it) ---

const fakeSession = {
  user: {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
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

// --- mutable fixture: tests set this before calling helpers ---
let nextSession: typeof fakeSession | null = null;
const mockGetSession = mock(async () => nextSession);

const mockRedirect = mock((_url: string): never => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT" });
});

// --- module mocks (must be set up before the dynamic import below) ---

mock.module("better-auth", () => ({
  betterAuth: () => ({
    api: { getSession: mockGetSession },
  }),
}));

mock.module("better-auth/adapters/prisma", () => ({
  prismaAdapter: () => ({}),
}));

mock.module("@/services/prisma", () => ({ default: {} }));

mock.module("@/config/env.mjs", () => ({
  env: {
    GOOGLE_CLIENT_ID: "mock-google-id",
    GOOGLE_CLIENT_SECRET: "mock-google-secret",
    GITHUB_ID: "mock-github-id",
    GITHUB_SECRET: "mock-github-secret",
  },
}));

mock.module("next/headers", () => ({
  headers: async () => new Headers(),
}));

mock.module("next/navigation", () => ({
  // Include notFound so subsequent test files that import page.tsx can also
  // use this mock (Bun 1.3.x shares mock state across files in the same run).
  notFound: mock((): never => {
    throw Object.assign(new Error("NEXT_NOT_FOUND"), {
      digest: "NEXT_NOT_FOUND",
    });
  }),
  redirect: mockRedirect,
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

// Dynamic import runs after all mock.module() calls, so auth.ts sees the
// mocked versions of better-auth, next/headers, and next/navigation.
const { requireSessionForPage, requireSessionForRoute } = await import(
  "./auth"
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("requireSessionForRoute", () => {
  beforeEach(() => {
    nextSession = null;
    mockGetSession.mockClear();
  });

  it("returns { ok: true, session } when session exists", async () => {
    nextSession = fakeSession;
    const result = await requireSessionForRoute();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session).toEqual(fakeSession);
    }
  });

  it("returns { ok: false, response: 401 } when no session", async () => {
    // nextSession is null (default)
    const result = await requireSessionForRoute();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      const body = await result.response.json();
      expect(body).toEqual({ message: "Unauthorized" });
    }
  });
});

describe("requireSessionForPage", () => {
  beforeEach(() => {
    nextSession = null;
    mockGetSession.mockClear();
    mockRedirect.mockClear();
  });

  it("returns session when session exists", async () => {
    nextSession = fakeSession;
    const result = await requireSessionForPage();
    expect(result).toEqual(fakeSession);
  });

  it("calls redirect('/login') with no session and no callbackUrl", async () => {
    // nextSession is null — redirect must be called
    await expect(requireSessionForPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("calls redirect with encoded callbackUrl when no session", async () => {
    await expect(requireSessionForPage("/tools/checkout")).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(mockRedirect).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Ftools%2Fcheckout"
    );
  });
});
