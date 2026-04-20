import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Fixtures — a pending transaction on an order
// ---------------------------------------------------------------------------

const fakePendingTx = {
  id: "tx-1",
  amount: { toNumber: () => 1296 },
  currency: "TWD",
  status: "PENDING" as string,
};

const fakeOrderWithPending = {
  id: "order-abc",
  transactions: [fakePendingTx],
};

const fakeConfirmSuccess = {
  returnCode: "0000",
  returnMessage: "Success",
  info: { orderId: "order-abc", transactionId: 99_999 },
};

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

type FakeOrder = typeof fakeOrderWithPending | null;
const mockFindUnique = mock(
  (): Promise<FakeOrder> => Promise.resolve(fakeOrderWithPending)
);
const mockPrismaTransaction = mock((ops: unknown) => {
  if (Array.isArray(ops)) {
    return Promise.all(ops);
  }
  return Promise.resolve();
});
const mockOrderUpdate = mock(() => Promise.resolve({ id: "order-abc" }));
const mockTxUpdate = mock(() => Promise.resolve({ id: "tx-1" }));

mock.module("@/services/prisma", () => ({
  default: {
    commerceOrder: {
      findUnique: mockFindUnique,
      update: mockOrderUpdate,
    },
    commerceTransaction: { update: mockTxUpdate },
    $transaction: mockPrismaTransaction,
  },
}));

const mockConfirmApi = mock(() => Promise.resolve(fakeConfirmSuccess));

mock.module("@/services/line-pay", () => ({
  confirmApi: mockConfirmApi,
  ConfirmApiReturnCode: { Success: "0000", InternalError: "9000" },
}));

mock.module("next/server", () => ({
  NextResponse: {
    redirect: (destination: URL | string, init?: number | ResponseInit) => {
      const status = typeof init === "number" ? init : (init?.status ?? 307);
      return new Response(null, {
        status,
        headers: { location: destination.toString() },
      });
    },
  },
}));

// Dynamic import AFTER mocks
const { GET } = await import("../route");

function makeRequest(path: string): NextRequest {
  return new Request(`http://localhost:3000${path}`) as unknown as NextRequest;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/checkout/confirm", () => {
  beforeEach(() => {
    mockFindUnique.mockClear();
    mockPrismaTransaction.mockClear();
    mockOrderUpdate.mockClear();
    mockTxUpdate.mockClear();
    mockConfirmApi.mockClear();

    mockFindUnique.mockImplementation(() =>
      Promise.resolve(fakeOrderWithPending)
    );
    mockConfirmApi.mockImplementation(() =>
      Promise.resolve(fakeConfirmSuccess)
    );
    mockPrismaTransaction.mockImplementation((ops: unknown) => {
      if (Array.isArray(ops)) {
        return Promise.all(ops);
      }
      return Promise.resolve();
    });
    mockOrderUpdate.mockImplementation(() =>
      Promise.resolve({ id: "order-abc" })
    );
    mockTxUpdate.mockImplementation(() => Promise.resolve({ id: "tx-1" }));
  });

  it("redirects to /tools/checkout with error when orderId missing", async () => {
    const res = await GET(
      makeRequest("/api/checkout/confirm?transactionId=99")
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain(
      "/tools/checkout?error=missing_params"
    );
    expect(mockConfirmApi).not.toHaveBeenCalled();
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  it("redirects to /tools/checkout with error when transactionId missing", async () => {
    const res = await GET(makeRequest("/api/checkout/confirm?orderId=abc"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain(
      "/tools/checkout?error=missing_params"
    );
    expect(mockConfirmApi).not.toHaveBeenCalled();
  });

  it("redirects to detail page without calling LINE Pay when order not found", async () => {
    mockFindUnique.mockImplementationOnce(() => Promise.resolve(null));

    const res = await GET(
      makeRequest("/api/checkout/confirm?orderId=missing&transactionId=99")
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/tools/checkout/missing");
    expect(mockConfirmApi).not.toHaveBeenCalled();
  });

  it("is idempotent — skips LINE Pay call when transaction already COMPLETED", async () => {
    mockFindUnique.mockImplementationOnce(() =>
      Promise.resolve({
        id: "order-abc",
        transactions: [{ ...fakePendingTx, status: "COMPLETED" }],
      })
    );

    const res = await GET(
      makeRequest("/api/checkout/confirm?orderId=order-abc&transactionId=99")
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/tools/checkout/order-abc");
    expect(mockConfirmApi).not.toHaveBeenCalled();
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });

  it("marks order + transaction COMPLETED on LINE Pay success", async () => {
    const res = await GET(
      makeRequest("/api/checkout/confirm?orderId=order-abc&transactionId=99999")
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/tools/checkout/order-abc");

    expect(mockConfirmApi).toHaveBeenCalledTimes(1);
    const [txId, param] = mockConfirmApi.mock.calls[0] as unknown as [
      string,
      { amount: number; currency: string },
    ];
    expect(txId).toBe("99999");
    expect(param.amount).toBe(1296);
    expect(param.currency).toBe("TWD");

    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
    // Two ops inside the transaction: tx update + order update
    const calls = (
      mockTxUpdate.mock.calls as unknown as [
        { where: { id: string }; data: { status: string } },
      ][]
    )[0];
    expect(calls[0].where.id).toBe("tx-1");
    expect(calls[0].data.status).toBe("COMPLETED");

    const orderCall = (
      mockOrderUpdate.mock.calls as unknown as [
        { where: { id: string }; data: { status: string } },
      ][]
    )[0];
    expect(orderCall[0].where.id).toBe("order-abc");
    expect(orderCall[0].data.status).toBe("COMPLETED");
  });

  it("marks order + transaction FAILED on non-0000 returnCode", async () => {
    mockConfirmApi.mockImplementationOnce(() =>
      Promise.resolve({
        returnCode: "9000",
        returnMessage: "Internal error",
        info: {} as never,
      })
    );

    const res = await GET(
      makeRequest("/api/checkout/confirm?orderId=order-abc&transactionId=99999")
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/tools/checkout/order-abc");

    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
    const txUpdate = (
      mockTxUpdate.mock.calls as unknown as [{ data: { status: string } }][]
    )[0];
    expect(txUpdate[0].data.status).toBe("FAILED");

    const orderUpdate = (
      mockOrderUpdate.mock.calls as unknown as [{ data: { status: string } }][]
    )[0];
    expect(orderUpdate[0].data.status).toBe("FAILED");
  });

  it("marks order + transaction FAILED when confirmApi throws", async () => {
    const abortError = Object.assign(new Error("The operation was aborted"), {
      name: "AbortError",
    });
    mockConfirmApi.mockImplementationOnce(() => Promise.reject(abortError));

    const res = await GET(
      makeRequest("/api/checkout/confirm?orderId=order-abc&transactionId=99999")
    );
    expect(res.status).toBe(307);

    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
    const txUpdate = (
      mockTxUpdate.mock.calls as unknown as [{ data: { status: string } }][]
    )[0];
    expect(txUpdate[0].data.status).toBe("FAILED");
  });
});
