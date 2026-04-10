import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import type { NextApiRequest, NextApiResponse } from "next";

// Mock the service before importing handler
mock.module("@/services/recipe", () => ({
  createRecipe: mock(() => Promise.resolve(true)),
}));

describe("POST /api/recipe/create", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
  let mockRes: NextApiResponse;
  let warnSpy: ReturnType<typeof spyOn>;
  let errorSpy: ReturnType<typeof spyOn>;

  beforeEach(async () => {
    handler = (await import("./create")).default;
    warnSpy = spyOn(console, "warn").mockImplementation(() => undefined);
    errorSpy = spyOn(console, "error").mockImplementation(() => undefined);

    const send = mock();
    const status = mock(() => ({ send, end: mock(), json: mock() }));
    const setHeader = mock();
    mockRes = {
      send,
      status,
      setHeader,
      end: mock(),
    } as unknown as NextApiResponse;
  });

  it("returns 405 for non-POST methods", async () => {
    const req = { method: "GET", headers: {}, body: {} } as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(405);
  });

  it("returns 400 for missing authorization header", async () => {
    const req = {
      method: "POST",
      headers: { authorization: undefined },
      body: { name: "test recipe", secret: "s3cr3t" },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("does not log the request body to console.warn", async () => {
    const sensitiveBody = { name: "recipe", ingredients: ["secret sauce"] };
    const req = {
      method: "POST",
      headers: { authorization: "Bearer abc123" },
      body: sensitiveBody,
    } as unknown as NextApiRequest;
    await handler(req, mockRes);

    for (const call of warnSpy.mock.calls) {
      const logged = call.map((a) => JSON.stringify(a)).join(" ");
      expect(logged).not.toContain("secret sauce");
      expect(logged).not.toContain("ingredients");
    }
  });

  it("does not log the authorization header to console.error", async () => {
    const req = {
      method: "POST",
      headers: { authorization: "short" }, // too short, triggers error path
      body: {},
    } as unknown as NextApiRequest;
    await handler(req, mockRes);

    for (const call of errorSpy.mock.calls) {
      const logged = call.map((a) => JSON.stringify(a)).join(" ");
      // The token value must not appear in logs
      expect(logged).not.toContain("short");
    }
  });
});
