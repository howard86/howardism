import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

// Mock mail service before importing the handler, to avoid SendGrid client initialisation
mock.module("@/services/mail", () => ({
  subscribeToNewsletter: mock(() => Promise.resolve()),
}));

describe("POST /api/subscription — request body not echoed in error responses (#525)", () => {
  let handler: NextApiHandler;

  beforeEach(async () => {
    handler = (await import("@/pages/api/subscription")).default;
  });

  it("400 response body does not contain request body contents", async () => {
    const json = mock();
    let capturedStatus = 200;

    const mockRes = {
      json,
      status: mock((code: number) => {
        capturedStatus = code;
        return { json };
      }),
      setHeader: mock(),
      redirect: mock(),
      end: mock(),
      headersSent: false,
    } as unknown as NextApiResponse;

    const req = {
      method: "POST",
      url: "/api/subscription",
      body: { email: 42, secret: "leak-me-525" },
    } as unknown as NextApiRequest;

    await handler(req, mockRes);

    expect(capturedStatus).toBe(400);
    const responseBody = json.mock.calls[0]?.[0] as Record<string, unknown>;
    const bodyStr = JSON.stringify(responseBody);
    // Response body must never echo raw request body contents
    expect(bodyStr).not.toContain("leak-me-525");
    expect(bodyStr).not.toContain("req.body");
    // The number 42 (the bogus email value) must not appear in the response
    expect(bodyStr).not.toContain("42");
  });
});
