import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// ---------------------------------------------------------------------------
// Module mocks — must be registered before the dynamic import of line-pay.ts
// ---------------------------------------------------------------------------

mock.module("@/config/env.mjs", () => ({
  env: {
    LINE_PAY_API_URL: "https://sandbox-api-pay.line.me",
    LINE_PAY_CHANNEL_ID: "test-channel-id",
    LINE_PAY_CHANNEL_SECRET_KEY: "test-secret-key",
  },
}));

// Avoid real HMAC computation: deterministic signature stub.
mock.module("node:crypto", () => ({
  createHmac: () => ({
    update: () => ({
      digest: () => "mock-signature-base64",
    }),
  }),
  randomUUID: () => "test-nonce-uuid",
}));

// Dynamic import AFTER mocks are registered.
const { requestApi, confirmApi, RequestApiReturnCode, ConfirmApiReturnCode } =
  await import("../line-pay");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const minimalRequestParam = {
  amount: 100,
  currency: "TWD",
  orderId: "order-001",
  packages: [
    {
      id: "pkg-1",
      amount: 100,
      products: [{ name: "Test Product", quantity: 1, price: 100 }],
    },
  ],
  redirectUrls: {
    confirmUrl: "https://example.com/confirm",
    cancelUrl: "https://example.com/cancel",
  },
};

const minimalConfirmParam = { amount: 100, currency: "TWD" };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("requestApi", () => {
  beforeEach(() => {
    // Reset to a default success response before each test.
    global.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            returnCode: "0000",
            returnMessage: "Success",
            info: {
              transactionId: 12_345,
              paymentAccessToken: "token-abc",
              paymentUrl: {
                app: "linepay://pay",
                web: "https://sandbox-web-pay.line.me/pay/confirm?transactionId=12345",
              },
            },
          }),
          { status: 200 }
        )
      )
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    // Restore global fetch to avoid leaking across test files.
    global.fetch = fetch;
  });

  it("returns parsed response body on HTTP 200", async () => {
    const result = await requestApi(minimalRequestParam);
    expect(result.returnCode).toBe(RequestApiReturnCode.Success);
    expect(result.info.transactionId).toBe(12_345);
    expect(result.info.paymentUrl.web).toContain("sandbox-web-pay.line.me");
  });

  it("throws with HTTP status when upstream returns 5xx", async () => {
    global.fetch = mock(() =>
      Promise.resolve(
        new Response("<html>Internal Server Error</html>", {
          status: 500,
          statusText: "Internal Server Error",
        })
      )
    ) as unknown as typeof fetch;

    await expect(requestApi(minimalRequestParam)).rejects.toThrow("HTTP 500");
  });

  it("throws with HTTP status when upstream returns 4xx", async () => {
    global.fetch = mock(() =>
      Promise.resolve(
        new Response("<html>Bad Request</html>", {
          status: 400,
          statusText: "Bad Request",
        })
      )
    ) as unknown as typeof fetch;

    await expect(requestApi(minimalRequestParam)).rejects.toThrow("HTTP 400");
  });

  it("rejects with abort-derived error when fetch hangs (timeout)", async () => {
    const abortError = Object.assign(new Error("The operation was aborted"), {
      name: "AbortError",
    });
    global.fetch = mock(() =>
      Promise.reject(abortError)
    ) as unknown as typeof fetch;

    await expect(requestApi(minimalRequestParam)).rejects.toThrow(
      "The operation was aborted"
    );
  });

  it("clears the timeout timer after a successful response", async () => {
    const originalClearTimeout = globalThis.clearTimeout;
    const clearTimeoutSpy = mock(
      (id: ReturnType<typeof setTimeout> | undefined) => {
        originalClearTimeout(id);
      }
    );
    globalThis.clearTimeout = clearTimeoutSpy as unknown as typeof clearTimeout;

    try {
      await requestApi(minimalRequestParam);
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.clearTimeout = originalClearTimeout;
    }
  });
});

describe("confirmApi", () => {
  beforeEach(() => {
    global.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            returnCode: "0000",
            returnMessage: "Success",
            info: {
              orderId: "order-001",
              transactionId: 12_345,
            },
          }),
          { status: 200 }
        )
      )
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = fetch;
  });

  it("returns parsed response body on HTTP 200", async () => {
    const result = await confirmApi("12345", minimalConfirmParam);
    expect(result.returnCode).toBe(ConfirmApiReturnCode.Success);
    expect(result.info.orderId).toBe("order-001");
  });

  it("throws with HTTP status when upstream returns 5xx", async () => {
    global.fetch = mock(() =>
      Promise.resolve(
        new Response("<html>Internal Server Error</html>", {
          status: 500,
          statusText: "Internal Server Error",
        })
      )
    ) as unknown as typeof fetch;

    await expect(confirmApi("12345", minimalConfirmParam)).rejects.toThrow(
      "HTTP 500"
    );
  });

  it("rejects with abort-derived error when fetch hangs (timeout)", async () => {
    const abortError = Object.assign(new Error("The operation was aborted"), {
      name: "AbortError",
    });
    global.fetch = mock(() =>
      Promise.reject(abortError)
    ) as unknown as typeof fetch;

    await expect(confirmApi("12345", minimalConfirmParam)).rejects.toThrow(
      "The operation was aborted"
    );
  });
});
