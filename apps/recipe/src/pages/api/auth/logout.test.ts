import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextApiRequest, NextApiResponse } from "next";

describe("POST /api/auth/logout", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => unknown;
  let mockRes: NextApiResponse;
  let setHeader: ReturnType<typeof mock>;
  let send: ReturnType<typeof mock>;

  beforeEach(async () => {
    handler = (await import("./logout")).default;
    send = mock();
    const status = mock(() => ({ send, end: mock(), json: mock() }));
    setHeader = mock();
    mockRes = {
      send,
      status,
      setHeader,
      end: mock(),
    } as unknown as NextApiResponse;
  });

  it("returns 405 for non-POST methods", () => {
    const req = { method: "GET", headers: {} } as NextApiRequest;
    handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(405);
  });

  it("clears the recipe_auth cookie and responds 200", () => {
    const req = {
      method: "POST",
      headers: { cookie: "recipe_auth=abc" },
      cookies: { recipe_auth: "abc" },
    } as unknown as NextApiRequest;
    handler(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    const cookieCall = setHeader.mock.calls.find(
      (call) => call[0] === "Set-Cookie"
    );
    expect(cookieCall).toBeDefined();
    const cookieValue = cookieCall?.[1] as string;
    expect(cookieValue).toContain("recipe_auth=");
    expect(cookieValue).toContain("Max-Age=0");
    expect(cookieValue).toContain("HttpOnly");
    expect(cookieValue).toContain("Path=/");
  });

  it("is idempotent when no cookie is present", () => {
    const req = {
      method: "POST",
      headers: {},
      cookies: {},
    } as unknown as NextApiRequest;
    handler(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    const cookieCall = setHeader.mock.calls.find(
      (call) => call[0] === "Set-Cookie"
    );
    expect(cookieCall).toBeDefined();
  });
});
