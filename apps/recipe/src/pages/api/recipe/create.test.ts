import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import type { NextApiRequest, NextApiResponse } from "next";

const mockCreateRecipe = mock(() => Promise.resolve(true));

// Mock the service before importing handler
mock.module("@/services/recipe", () => ({
  createRecipe: mockCreateRecipe,
}));

const validRecipe = {
  description: "A tasty dish",
  title: "Test Recipe",
  ingredients: [{ amount: 1, name: "Salt", unit: "tsp" }],
  seasonings: [{ amount: 0.5, name: "Pepper", unit: "tsp" }],
  steps: [{ description: "Mix everything", summary: "Mix" }],
};

describe("POST /api/recipe/create", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>;
  let mockRes: NextApiResponse;
  let warnSpy: ReturnType<typeof spyOn>;
  let errorSpy: ReturnType<typeof spyOn>;

  beforeEach(async () => {
    handler = (await import("./create")).default;
    mockCreateRecipe.mockClear();
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
    expect(mockCreateRecipe).not.toHaveBeenCalled();
  });

  it("returns 401 for missing authorization header", async () => {
    const req = {
      method: "POST",
      headers: { authorization: undefined },
      body: validRecipe,
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockCreateRecipe).not.toHaveBeenCalled();
  });

  it("returns 401 for non-Bearer authorization header", async () => {
    const req = {
      method: "POST",
      headers: { authorization: "Basic dXNlcjpwYXNz" },
      body: validRecipe,
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockCreateRecipe).not.toHaveBeenCalled();
  });

  it("returns 401 for authorization header that is too short to be valid", async () => {
    const req = {
      method: "POST",
      headers: { authorization: "Bearer" },
      body: validRecipe,
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockCreateRecipe).not.toHaveBeenCalled();
  });

  it("returns 400 with flattened errors for malformed body with valid Bearer", async () => {
    const req = {
      method: "POST",
      headers: { authorization: "Bearer valid-token-abc" },
      body: { title: "missing required fields" },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockCreateRecipe).not.toHaveBeenCalled();
    const statusResult = (mockRes.status as ReturnType<typeof mock>).mock
      .results[0]?.value;
    expect(statusResult.send).toHaveBeenCalledWith(
      expect.objectContaining({ errors: expect.any(Object) })
    );
  });

  it("returns 400 for completely invalid body", async () => {
    const req = {
      method: "POST",
      headers: { authorization: "Bearer valid-token-abc" },
      body: null,
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockCreateRecipe).not.toHaveBeenCalled();
  });

  it("returns 200 and calls createRecipe for valid Bearer and valid body", async () => {
    const req = {
      method: "POST",
      headers: { authorization: "Bearer valid-token-abc" },
      body: validRecipe,
    } as unknown as NextApiRequest;
    await handler(req, mockRes);
    expect(mockCreateRecipe).toHaveBeenCalledWith(
      validRecipe,
      "Bearer valid-token-abc"
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it("does not log the request body to console.warn", async () => {
    const sensitiveBody = {
      ...validRecipe,
      title: "ultra-secret-recipe-name",
    };
    const req = {
      method: "POST",
      headers: { authorization: "Bearer abc123" },
      body: sensitiveBody,
    } as unknown as NextApiRequest;
    await handler(req, mockRes);

    for (const call of warnSpy.mock.calls) {
      const logged = call.map((a) => JSON.stringify(a)).join(" ");
      expect(logged).not.toContain("ultra-secret-recipe-name");
      expect(logged).not.toContain("ingredients");
    }
  });

  it("does not log the authorization header or token to console.error", async () => {
    const req = {
      method: "POST",
      headers: { authorization: "Basic notabearer-shouldtrigger401" },
      body: {},
    } as unknown as NextApiRequest;
    await handler(req, mockRes);

    for (const call of errorSpy.mock.calls) {
      const logged = call.map((a) => JSON.stringify(a)).join(" ");
      expect(logged).not.toContain("notabearer-shouldtrigger401");
      expect(logged).not.toContain("Authorization");
      expect(logged).not.toContain("authorization");
    }
  });

  it("does not log the Bearer token value to console.error on body validation failure", async () => {
    const req = {
      method: "POST",
      headers: { authorization: "Bearer supersecret-token-xyz" },
      body: { bad: "body" },
    } as unknown as NextApiRequest;
    await handler(req, mockRes);

    for (const call of errorSpy.mock.calls) {
      const logged = call.map((a) => JSON.stringify(a)).join(" ");
      expect(logged).not.toContain("supersecret-token-xyz");
      expect(logged).not.toContain("Bearer");
    }
  });
});
