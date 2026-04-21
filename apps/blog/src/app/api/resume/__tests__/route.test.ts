import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Fixtures
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

const fakeApplicant = {
  id: "applicant-1",
  email: "owner@example.com",
  name: "Owner User",
  address: "123 Test St",
  phone: "0912345678",
  github: "owneruser",
  website: "https://owner.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeProfile = {
  id: "profile-1",
  applicantId: "applicant-1",
  company: "Test Corp",
  position: "Engineer",
  summary: "Test summary",
  ordering: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeProfileWithApplicant = {
  ...fakeProfile,
  applicant: fakeApplicant,
};

// ---------------------------------------------------------------------------
// Module mocks
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

const mockUpsert = mock(() => Promise.resolve(fakeApplicant));
const mockCreate = mock(() => Promise.resolve(fakeProfile));
const mockFindUnique = mock<
  () => Promise<typeof fakeProfileWithApplicant | null>
>(() => Promise.resolve(fakeProfileWithApplicant));
const mockUpdate = mock(() => Promise.resolve(fakeProfile));

// #587: transaction mock — passes the same mock functions as the tx client so
// existing per-mock assertions (mockUpsert.mock.calls etc.) continue to work.
const mockTransaction = mock(
  async (
    callback: (tx: {
      resumeApplicant: { upsert: typeof mockUpsert };
      resumeProfile: { create: typeof mockCreate; update: typeof mockUpdate };
    }) => unknown,
    _options?: unknown
  ) =>
    callback({
      resumeApplicant: { upsert: mockUpsert },
      resumeProfile: { create: mockCreate, update: mockUpdate },
    })
);

mock.module("@/services/prisma", () => ({
  default: {
    $transaction: mockTransaction,
    resumeApplicant: { upsert: mockUpsert },
    resumeProfile: {
      create: mockCreate,
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
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

// Dynamic import AFTER mocks
const { POST, PUT } = await import("../route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Body without email — valid after #591 fix (email is session-pinned server-side)
const validBody = {
  name: "Owner User",
  address: "123 Test St",
  phone: "0912345678",
  github: "owneruser",
  website: "https://owner.com",
  company: "Test Corp",
  position: "Engineer",
  summary: "Test summary",
  experiences: [],
  projects: [],
  educations: [],
  skills: [],
  languages: [],
};

function makePostRequest(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function makePutRequest(body: unknown, profileId = "profile-1"): NextRequest {
  return new Request(
    `http://localhost:3000/api/resume?profileId=${profileId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  ) as unknown as NextRequest;
}

// ---------------------------------------------------------------------------
// POST /api/resume
// ---------------------------------------------------------------------------

describe("POST /api/resume", () => {
  beforeEach(() => {
    mockRequireSessionForRoute.mockClear();
    mockUpsert.mockClear();
    mockCreate.mockClear();
    mockTransaction.mockClear();
    mockRequireSessionForRoute.mockImplementation(
      (): Promise<SessionResult> =>
        Promise.resolve({ ok: true as const, session: fakeSession })
    );
    mockUpsert.mockImplementation(() => Promise.resolve(fakeApplicant));
    mockCreate.mockImplementation(() => Promise.resolve(fakeProfile));
    mockTransaction.mockImplementation(
      async (
        callback: (tx: {
          resumeApplicant: { upsert: typeof mockUpsert };
          resumeProfile: {
            create: typeof mockCreate;
            update: typeof mockUpdate;
          };
        }) => unknown,
        _options?: unknown
      ) =>
        callback({
          resumeApplicant: { upsert: mockUpsert },
          resumeProfile: { create: mockCreate, update: mockUpdate },
        })
    );
  });

  it("returns 401 when unauthenticated", async () => {
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

    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body (missing required fields)", async () => {
    const res = await POST(makePostRequest({ name: "Only Name" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(typeof body.message).toBe("string");
  });

  // #591 regression: body email must be rejected
  it("returns 400 when body contains email field", async () => {
    const res = await POST(
      makePostRequest({ ...validBody, email: "attacker@evil.com" })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("pins applicant upsert to session email, ignores body email (POST)", async () => {
    await POST(makePostRequest(validBody));
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const upsertCall = (
      mockUpsert.mock.calls[0] as unknown as [
        {
          where: { email: string };
          update: Record<string, unknown>;
          create: { email: string };
        },
      ]
    )[0];
    expect(upsertCall.where.email).toBe("owner@example.com");
    expect(upsertCall.create.email).toBe("owner@example.com");
    // update payload must NOT contain email (session-pinned, not client-supplied)
    expect(upsertCall.update.email).toBeUndefined();
  });

  it("returns 200 with profileId on valid POST", async () => {
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBe("profile-1");
  });

  it("upserts applicant by session email and creates profile", async () => {
    await POST(makePostRequest(validBody));
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    // Applicant upsert must use session email as the lookup key
    const upsertCall = (
      mockUpsert.mock.calls[0] as unknown as [{ where: { email: string } }]
    )[0];
    expect(upsertCall.where.email).toBe("owner@example.com");
  });

  // #587 regression: atomicity — profile-create failure must roll back applicant upsert
  it("returns 500 and wraps writes in $transaction when profile create throws (POST)", async () => {
    mockCreate.mockImplementationOnce(() =>
      Promise.reject(new Error("DB constraint error"))
    );
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(500);
    // Both operations must have been inside a $transaction call
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it("calls $transaction with timeout >= 15000 and maxWait >= 5000 (POST)", async () => {
    await POST(makePostRequest(validBody));
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    const options = (
      mockTransaction.mock.calls[0] as unknown as [
        unknown,
        { timeout: number; maxWait: number },
      ]
    )[1];
    expect(options.timeout).toBeGreaterThanOrEqual(15_000);
    expect(options.maxWait).toBeGreaterThanOrEqual(5000);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/resume
// ---------------------------------------------------------------------------

describe("PUT /api/resume", () => {
  beforeEach(() => {
    mockRequireSessionForRoute.mockImplementation(
      (): Promise<SessionResult> =>
        Promise.resolve({ ok: true as const, session: fakeSession })
    );
    mockFindUnique.mockImplementation(() =>
      Promise.resolve(fakeProfileWithApplicant)
    );
    mockUpdate.mockImplementation(() => Promise.resolve(fakeProfile));
    mockUpsert.mockImplementation(() => Promise.resolve(fakeApplicant));
    mockTransaction.mockClear();
    mockTransaction.mockImplementation(
      async (
        callback: (tx: {
          resumeApplicant: { upsert: typeof mockUpsert };
          resumeProfile: {
            create: typeof mockCreate;
            update: typeof mockUpdate;
          };
        }) => unknown,
        _options?: unknown
      ) =>
        callback({
          resumeApplicant: { upsert: mockUpsert },
          resumeProfile: { create: mockCreate, update: mockUpdate },
        })
    );
  });

  it("returns 401 when unauthenticated", async () => {
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

    const res = await PUT(makePutRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("returns 404 when profileId does not exist", async () => {
    mockFindUnique.mockImplementationOnce(() => Promise.resolve(null));
    const res = await PUT(makePutRequest(validBody, "nonexistent-id"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 403 when session user does not own the profile", async () => {
    mockFindUnique.mockImplementationOnce(() =>
      Promise.resolve({
        ...fakeProfileWithApplicant,
        applicant: { ...fakeApplicant, email: "someone-else@example.com" },
      })
    );

    const res = await PUT(makePutRequest(validBody));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 for invalid body", async () => {
    const res = await PUT(makePutRequest({ name: "Only Name" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  // #591 regression: body email must be rejected on PUT too
  it("returns 400 when body contains email field", async () => {
    const res = await PUT(
      makePutRequest({ ...validBody, email: "attacker@evil.com" })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 200 on valid PUT by owner", async () => {
    const res = await PUT(makePutRequest(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // #587 regression: atomicity — profile-update failure must roll back applicant upsert
  it("returns 500 and wraps writes in $transaction when profile update throws (PUT)", async () => {
    mockUpdate.mockImplementationOnce(() =>
      Promise.reject(new Error("DB constraint error"))
    );
    const res = await PUT(makePutRequest(validBody));
    expect(res.status).toBe(500);
    // Both operations must have been inside a $transaction call
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });
});
