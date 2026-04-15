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

const fakeProducts = [
  {
    id: "prod-1",
    title: "Black T-Shirt M",
    price: { toNumber: () => 1000 },
  },
  {
    id: "prod-2",
    title: "White T-Shirt L",
    price: { toNumber: () => 800 },
  },
];

const fakeOrder = {
  id: "order-abc",
  email: "owner@example.com",
  name: "Owner User",
  status: "PENDING",
  totalPrice: { toNumber: () => 1296 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeLinePaySuccess = {
  returnCode: "0000",
  returnMessage: "Success",
  info: {
    transactionId: 99_999,
    paymentAccessToken: "token-xyz",
    paymentUrl: {
      app: "linepay://pay",
      web: "https://sandbox-web-pay.line.me/pay/confirm?transactionId=99999",
    },
  },
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

// Sub-mocks for the interactive $transaction callback
const mockOrderCreate = mock(() => Promise.resolve(fakeOrder));
const mockTransactionCreate = mock(() => Promise.resolve({ id: "tx-1" }));

const fakeTx = {
  commerceOrder: { create: mockOrderCreate },
  commerceTransaction: { create: mockTransactionCreate },
};

const mockFindMany = mock(() => Promise.resolve(fakeProducts));
const mockPrismaTransaction = mock(
  (callback: (tx: typeof fakeTx) => Promise<unknown>) => callback(fakeTx)
);

mock.module("@/services/prisma", () => ({
  default: {
    commerceProduct: { findMany: mockFindMany },
    $transaction: mockPrismaTransaction,
  },
}));

const mockRequestApi = mock(() => Promise.resolve(fakeLinePaySuccess));

mock.module("@/services/line-pay", () => ({
  requestApi: mockRequestApi,
  RequestApiReturnCode: { Success: "0000" },
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
const { POST } = await import("../route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validBody = {
  name: "Owner User",
  email: "owner@example.com",
  items: [
    { id: "prod-1", quantity: 1 },
    { id: "prod-2", quantity: 1 },
  ],
};

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/checkout", () => {
  beforeEach(() => {
    mockRequireSessionForRoute.mockClear();
    mockFindMany.mockClear();
    mockPrismaTransaction.mockClear();
    mockOrderCreate.mockClear();
    mockTransactionCreate.mockClear();
    mockRequestApi.mockClear();

    mockRequireSessionForRoute.mockImplementation(
      (): Promise<SessionResult> =>
        Promise.resolve({ ok: true as const, session: fakeSession })
    );
    mockFindMany.mockImplementation(() => Promise.resolve(fakeProducts));
    mockPrismaTransaction.mockImplementation(
      (callback: (tx: typeof fakeTx) => Promise<unknown>) => callback(fakeTx)
    );
    mockOrderCreate.mockImplementation(() => Promise.resolve(fakeOrder));
    mockTransactionCreate.mockImplementation(() =>
      Promise.resolve({ id: "tx-1" })
    );
    mockRequestApi.mockImplementation(() =>
      Promise.resolve(fakeLinePaySuccess)
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

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body (empty items)", async () => {
    const res = await POST(
      makeRequest({ name: "User", email: "a@b.com", items: [] })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 for invalid body (missing required fields)", async () => {
    const res = await POST(makeRequest({ name: "Only Name" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 200 with LINE Pay web URL on happy path", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toContain("sandbox-web-pay.line.me");
  });

  it("creates CommerceOrder + PENDING CommerceTransaction via $transaction BEFORE calling requestApi", async () => {
    const callOrder: string[] = [];

    mockPrismaTransaction.mockImplementationOnce(
      (callback: (tx: typeof fakeTx) => Promise<unknown>) => {
        callOrder.push("$transaction");
        return callback(fakeTx);
      }
    );
    mockRequestApi.mockImplementationOnce(() => {
      callOrder.push("requestApi");
      return Promise.resolve(fakeLinePaySuccess);
    });

    await POST(makeRequest(validBody));

    // Persistence must happen before the LINE Pay network call
    expect(callOrder).toEqual(["$transaction", "requestApi"]);

    // Order created with correct ownership email from session
    expect(mockOrderCreate).toHaveBeenCalledTimes(1);
    const orderCall = (
      mockOrderCreate.mock.calls[0] as unknown as [
        { data: { email: string; status: string } },
      ]
    )[0];
    expect(orderCall.data.email).toBe("owner@example.com");
    expect(orderCall.data.status).toBe("PENDING");

    // Transaction created with PENDING status linked to the order
    expect(mockTransactionCreate).toHaveBeenCalledTimes(1);
    const txCall = (
      mockTransactionCreate.mock.calls[0] as unknown as [
        { data: { orderId: string; status: string; currency: string } },
      ]
    )[0];
    expect(txCall.data.orderId).toBe(fakeOrder.id);
    expect(txCall.data.status).toBe("PENDING");
    expect(txCall.data.currency).toBe("TWD");
  });
});
