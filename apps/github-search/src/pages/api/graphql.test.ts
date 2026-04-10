import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextApiRequest, NextApiResponse } from "next";

const mockFetch = mock();

describe("GET /api/graphql", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
  let mockRes: NextApiResponse;

  beforeEach(async () => {
    globalThis.fetch = mockFetch;
    handler = (await import("./graphql")).default;

    const json = mock();
    const status = mock(() => ({ json, end: mock() }));
    mockRes = { json, status } as unknown as NextApiResponse;
  });

  afterEach(() => {
    mockFetch.mockClear();
  });

  it("returns 405 for GET requests", async () => {
    const req = { method: "GET", body: null } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(405);
  });

  it("returns 405 for PUT requests", async () => {
    const req = { method: "PUT", body: null } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(405);
  });

  it("returns 500 when GITHUB_ACCESS_TOKEN is missing", async () => {
    const original = process.env.GITHUB_ACCESS_TOKEN;
    process.env.GITHUB_ACCESS_TOKEN = undefined;

    const req = {
      method: "POST",
      body: { query: "{ viewer { login } }" },
      headers: { "content-type": "application/json" },
    } as unknown as NextApiRequest;

    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);

    process.env.GITHUB_ACCESS_TOKEN = original;
  });
});
