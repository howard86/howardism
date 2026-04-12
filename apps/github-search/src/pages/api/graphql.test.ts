import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextApiRequest, NextApiResponse } from "next";

const mockFetch = mock();

describe("GET /api/graphql", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
  let mockRes: NextApiResponse;

  beforeEach(async () => {
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    // Provide a token for all tests that reach the upstream fetch path
    process.env.GITHUB_ACCESS_TOKEN = "test-github-token";

    handler = (await import("./graphql")).default;

    const json = mock();
    const status = mock(() => ({ json, end: mock() }));
    mockRes = { json, status } as unknown as NextApiResponse;
  });

  afterEach(() => {
    mockFetch.mockClear();
  });

  // ── Existing regression tests ─────────────────────────────────────────────

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

  // ── New hardening tests ───────────────────────────────────────────────────

  it("returns 400 for malformed body (missing operationName)", async () => {
    const req = {
      method: "POST",
      body: { query: 'query getUser { user(login: "foo") { login } }' },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed body (missing query)", async () => {
    const req = {
      method: "POST",
      body: { operationName: "getUser" },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 400 for unknown operationName without calling upstream", async () => {
    const req = {
      method: "POST",
      body: {
        query: "query deleteEverything { nuke }",
        operationName: "deleteEverything",
      },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 400 when query contains a mutation, even with allowed operationName", async () => {
    const req = {
      method: "POST",
      body: {
        query: "mutation { createIssue(input: {}) { issue { id } } }",
        operationName: "getUser",
      },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 400 when query exceeds depth limit (>8)", async () => {
    // 9 levels deep: a.b.c.d.e.f.g.h.i
    const deepQuery = `
      query getUser {
        a { b { c { d { e { f { g { h { i } } } } } } } }
      }
    `;
    const req = {
      method: "POST",
      body: { query: deepQuery, operationName: "getUser" },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("forwards valid allowed query to upstream with Bearer token", async () => {
    const upstreamResponse = { data: { user: { login: "testuser" } } };
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve(upstreamResponse),
    });

    const req = {
      method: "POST",
      body: {
        query:
          "query getUser($username: String!) { user(login: $username) { login name } }",
        operationName: "getUser",
        variables: { username: "testuser" },
      },
    } as unknown as NextApiRequest;

    await handler(req, mockRes);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-github-token",
        }),
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});
