import { beforeEach, describe, expect, it, mock } from "bun:test";

// ---------------------------------------------------------------------------
// Test for AddResumeProfilePage server-component auth gate (#592).
//
// Mocking boundary: @/lib/auth (not better-auth / next/navigation chains).
// requireSessionForPage's own behaviour is tested in auth.test.ts.
// ---------------------------------------------------------------------------

const fakeSession = {
  user: {
    id: "user-1",
    email: "owner@example.com",
    name: "Owner User",
    emailVerified: true,
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

const mockRequireSessionForPage = mock(
  async (_callbackUrl?: string) => fakeSession
);

mock.module("@/lib/auth", () => ({
  requireSessionForPage: mockRequireSessionForPage,
  // Included so route tests that mock @/lib/auth don't drop this export
  requireSessionForRoute: mock(() =>
    Promise.resolve({ ok: true as const, session: fakeSession })
  ),
}));

// Stub out the client component so the Server Component test never touches
// browser APIs / React hooks.
mock.module("../ResumeEditor", () => ({
  default: () => null,
}));

const { default: AddResumeProfilePage } = await import("./page");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AddResumeProfilePage", () => {
  beforeEach(() => {
    mockRequireSessionForPage.mockClear();
    mockRequireSessionForPage.mockImplementation(
      async (_callbackUrl?: string) => fakeSession
    );
  });

  // §4.1 — unauthenticated visitor must be redirected; editor must not render
  it("propagates NEXT_REDIRECT when unauthenticated and calls helper with /profile/resume/add", async () => {
    mockRequireSessionForPage.mockImplementationOnce(
      (_callbackUrl?: string): Promise<typeof fakeSession> => {
        throw Object.assign(new Error("NEXT_REDIRECT"), {
          digest: "NEXT_REDIRECT",
        });
      }
    );
    await expect(AddResumeProfilePage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRequireSessionForPage).toHaveBeenCalledWith(
      "/profile/resume/add"
    );
  });

  // §4.2 — authenticated visitor must see the editor
  it("renders ResumeEditor for authenticated user", async () => {
    const result = await AddResumeProfilePage();
    expect(result).toBeTruthy();
    expect(mockRequireSessionForPage).toHaveBeenCalledWith(
      "/profile/resume/add"
    );
  });
});
