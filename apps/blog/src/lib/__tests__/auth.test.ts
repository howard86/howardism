/**
 * Unit tests for the betterAuth config in apps/blog/src/lib/auth.ts (#496)
 *
 * Captures the options object passed to betterAuth so we can assert on the
 * security-critical config values without needing a database connection.
 */

import { describe, expect, it, mock } from "bun:test";

// ---------------------------------------------------------------------------
// Capture betterAuth call options before any module is imported
// ---------------------------------------------------------------------------

let capturedOptions: Record<string, unknown> = {};

mock.module("better-auth", () => ({
  betterAuth: (options: Record<string, unknown>) => {
    capturedOptions = options;
    return { api: { getSession: async () => null } };
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
    GOOGLE_CLIENT_ID: "google-id",
    GOOGLE_CLIENT_SECRET: "google-secret",
    GITHUB_ID: "github-id",
    GITHUB_SECRET: "github-secret",
  },
}));

mock.module("next/headers", () => ({
  headers: async () => new Headers(),
}));

mock.module("next/navigation", () => ({
  redirect: (_url: string): never => {
    throw Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT",
    });
  },
}));

mock.module("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), init),
  },
}));

// Mock mail service — auth.ts will import sendTransactionalEmail.
// Captured as a named mock so we can assert on its calls in the hook test.
const mockSendTransactionalEmail = mock(async (_args: unknown) => {
  // noop — side-effect captured via mock.calls assertions
});

mock.module("@/services/mail", () => ({
  sendTransactionalEmail: mockSendTransactionalEmail,
  subscribeToNewsletter: mock(async () => {
    // noop
  }),
}));

// Import auth.ts AFTER all mocks are in place — triggers betterAuth() call
await import("../auth");

// ---------------------------------------------------------------------------
// Assertions
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
