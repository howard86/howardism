import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import type { NextApiRequest, NextApiResponse } from "next";

const mockLogin = mock(() => Promise.resolve("test-jwt-token"));

// Mock the service before importing handler
mock.module("@/services/auth", () => ({
  login: mockLogin,
  verify: mock(() => Promise.resolve({})),
}));

describe("POST /api/auth/login", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>;
  let mockRes: NextApiResponse;
  let setHeader: ReturnType<typeof mock>;
  let send: ReturnType<typeof mock>;
  let warnSpy: ReturnType<typeof spyOn>;
  let errorSpy: ReturnType<typeof spyOn>;

  beforeEach(async () => {
    handler = (await import("./login")).default;
    mockLogin.mockClear();
    warnSpy = spyOn(console, "warn").mockImplementation(() => undefined);
    errorSpy = spyOn(console, "error").mockImplementation(() => undefined);

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

  it("returns 405 for non-POST methods", async () => {
    const req = { method: "GET", headers: {}, body: {} } as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("returns 400 with flattened errors for malformed body", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: { wrong: "field" },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockLogin).not.toHaveBeenCalled();
    const statusResult = (mockRes.status as ReturnType<typeof mock>).mock
      .results[0]?.value;
    expect(statusResult.send).toHaveBeenCalledWith(
      expect.objectContaining({ errors: expect.any(Object) })
    );
  });

  it("returns 400 for missing body fields", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: {},
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("returns 200 and sets HttpOnly recipe_auth cookie on success", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: { identifier: "user@example.com", password: "s3cr3t" },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockLogin).toHaveBeenCalledWith({
      identifier: "user@example.com",
      password: "s3cr3t",
    });
    expect(mockRes.status).toHaveBeenCalledWith(200);

    const cookieCall = setHeader.mock.calls.find(
      (call) => call[0] === "Set-Cookie"
    );
    expect(cookieCall).toBeDefined();
    const cookieValue = cookieCall?.[1] as string;
    expect(cookieValue).toContain("recipe_auth=test-jwt-token");
    expect(cookieValue).toContain("HttpOnly");
    expect(cookieValue).toContain("SameSite=Lax");
    expect(cookieValue).toContain("Path=/");
    expect(cookieValue).toContain("Max-Age=604800");
  });

  it("response body on success contains no jwt", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: { identifier: "user@example.com", password: "s3cr3t" },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);

    for (const call of send.mock.calls) {
      const body = call[0];
      const serialized = JSON.stringify(body);
      expect(serialized).not.toContain("test-jwt-token");
      expect(serialized).not.toContain('"jwt"');
    }
  });

  it("does not log request body contents to console.warn", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: { identifier: "user@example.com", password: "supersecretpassword" },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);

    for (const call of warnSpy.mock.calls) {
      const logged = call.map((a) => JSON.stringify(a)).join(" ");
      expect(logged).not.toContain("supersecretpassword");
      expect(logged).not.toContain("identifier");
    }
  });

  it("does not log request body contents to console.error", async () => {
    const req = {
      method: "POST",
      headers: {},
      body: { identifier: "user@example.com", password: "supersecretpassword" },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);

    for (const call of errorSpy.mock.calls) {
      const logged = call.map((a) => JSON.stringify(a)).join(" ");
      expect(logged).not.toContain("supersecretpassword");
      expect(logged).not.toContain("identifier");
    }
  });
});
