import { beforeEach, describe, expect, it, mock } from "bun:test";

// ---------------------------------------------------------------------------
// IMPORTANT: Bun does NOT hoist mock.module() calls like Jest does.
// Static `import` statements are resolved before any user code runs, so we
// must use a dynamic import() for auth.ts — see the bottom of this preamble.
//
// mock.module() is process-wide. Keep a SINGLE auth.test.ts file per module
// so two mock factories for "better-auth" do not race each other.
// ---------------------------------------------------------------------------

// --- session fixture used by session-helper tests ---

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

// --- mutable session state + redirect spy ---
let nextSession: typeof fakeSession | null = null;
const mockGetSession = mock(async () => nextSession);

const mockRedirect = mock((_url: string): never => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT" });
});

// --- #496 config capture: unified better-auth mock captures options AND
// returns a working session API so requireSessionFor* helpers still work ---
let capturedOptions: Record<string, unknown> = {};

mock.module("better-auth", () => ({
  betterAuth: (options: Record<string, unknown>) => {
    capturedOptions = options;
    return { api: { getSession: mockGetSession } };
  },
}));

mock.module("better-auth/adapters/prisma", () => ({
  prismaAdapter: () => ({}),
}));

mock.module("@/services/prisma", () => ({ default: {} }));

mock.module("@/config/env.mjs", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-secret-value",
    BETTER_AUTH_URL: "http://localhost:3000",
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

const mockSendTransactionalEmail = mock(async (_args: unknown) => {
  // noop — spy
});

mock.module("@/services/mail", () => ({
  sendTransactionalEmail: mockSendTransactionalEmail,
  subscribeToNewsletter: mock(async () => {
    // noop
  }),
}));

// Dynamic import runs after all mock.module() calls, so auth.ts sees the
// mocked versions of better-auth, next/headers, and next/navigation.
const { requireSessionForPage, requireSessionForRoute } = await import(
  "../auth"
);

// ---------------------------------------------------------------------------
// #496 config assertions — introspect captured betterAuth() options
// ---------------------------------------------------------------------------

describe("betterAuth config — security requirements (#496)", () => {
  it("passes explicit secret: env.BETTER_AUTH_SECRET", () => {
    expect(capturedOptions.secret).toBe("test-secret-value");
  });

  it("passes explicit baseURL: env.BETTER_AUTH_URL", () => {
    expect(capturedOptions.baseURL).toBe("http://localhost:3000");
  });

  it("emailAndPassword.minPasswordLength === 8", () => {
    const ep = capturedOptions.emailAndPassword as Record<string, unknown>;
    expect(ep).toBeDefined();
    expect(ep.minPasswordLength).toBe(8);
  });

  it("emailAndPassword.requireEmailVerification === true", () => {
    const ep = capturedOptions.emailAndPassword as Record<string, unknown>;
    expect(ep).toBeDefined();
    expect(ep.requireEmailVerification).toBe(true);
  });

  it("emailVerification.sendVerificationEmail is wired up", () => {
    const ev = capturedOptions.emailVerification as Record<string, unknown>;
    expect(ev).toBeDefined();
    expect(typeof ev.sendVerificationEmail).toBe("function");
  });

  it("sendVerificationEmail calls sendTransactionalEmail with Verify subject and verification URL", async () => {
    const ev = capturedOptions.emailVerification as {
      sendVerificationEmail: (params: {
        user: { email: string };
        url: string;
      }) => Promise<void>;
    };
    const verificationUrl =
      "https://example.com/api/auth/verify-email?token=abc";

    await ev.sendVerificationEmail({
      user: { email: "user@example.com" },
      url: verificationUrl,
    });

    expect(mockSendTransactionalEmail).toHaveBeenCalledTimes(1);
    const [args] = mockSendTransactionalEmail.mock.calls[0] as [
      { to: string; subject: string; html: string },
    ];
    expect(args.to).toBe("user@example.com");
    expect(args.subject).toContain("Verify");
    expect(args.html).toContain(verificationUrl);
  });
});

// ---------------------------------------------------------------------------
// Session helper assertions — requireSessionForRoute / requireSessionForPage
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
