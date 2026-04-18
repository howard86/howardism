import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import type { NextApiRequest, NextApiResponse } from "next";

const mockVerify = mock(() =>
  Promise.resolve({ id: "u1", email: "a@b.com", username: "alice" })
);

mock.module("@/services/auth", () => ({
  login: mock(() => Promise.resolve("jwt")),
  verify: mockVerify,
}));

describe("GET /api/auth/me", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>;
  let mockRes: NextApiResponse;
  let send: ReturnType<typeof mock>;
  let errorSpy: ReturnType<typeof spyOn>;

  beforeEach(async () => {
    handler = (await import("./me")).default;
    mockVerify.mockClear();
    errorSpy = spyOn(console, "error").mockImplementation(() => undefined);

    send = mock();
    const status = mock(() => ({ send, end: mock(), json: mock() }));
    mockRes = {
      send,
      status,
      setHeader: mock(),
      end: mock(),
    } as unknown as NextApiResponse;
  });

  it("returns 405 for non-GET methods", async () => {
    const req = { method: "POST", headers: {}, cookies: {} } as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("returns 400 when recipe_auth cookie is absent", async () => {
    const req = {
      method: "GET",
      headers: {},
      cookies: {},
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("reads token from cookie and returns account on success", async () => {
    const req = {
      method: "GET",
      headers: { cookie: "recipe_auth=valid-jwt" },
      cookies: { recipe_auth: "valid-jwt" },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockVerify).toHaveBeenCalledWith("valid-jwt");
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it("returns 403 when verify throws", async () => {
    mockVerify.mockRejectedValueOnce(new Error("invalid"));
    const req = {
      method: "GET",
      headers: { cookie: "recipe_auth=bad" },
      cookies: { recipe_auth: "bad" },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("ignores legacy recipe-token request header", async () => {
    const req = {
      method: "GET",
      headers: { "recipe-token": "legacy" },
      cookies: {},
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockVerify).not.toHaveBeenCalled();
  });
});
