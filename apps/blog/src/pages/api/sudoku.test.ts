import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import type { NextApiRequest, NextApiResponse } from "next";

mock.module("@/server/libs/sudoku", () => ({
  SudokuDifficulty: { easy: "easy", medium: "medium", hard: "hard" },
  generateSudoku: mock(() => {
    throw new Error("generation failed");
  }),
  Sudoku: class {
    difficulty = "easy";
    encodedInput = "abc";
    input = [];
    static from(_code: string) {
      throw new Error("invalid code");
    }
  },
  solve: mock(() => ({ input: [] })),
}));

describe("GET /api/sudoku — error logging", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => void;
  let errorSpy: ReturnType<typeof spyOn>;
  let mockRes: NextApiResponse;

  beforeEach(async () => {
    handler = (await import("./sudoku")).default;
    errorSpy = spyOn(console, "error").mockImplementation(() => undefined);

    const json = mock();
    mockRes = {
      json,
      status: mock(() => ({ json })),
    } as unknown as NextApiResponse;
  });

  it("logs only the error message, not the full error object, on GET error", () => {
    const req = {
      method: "GET",
      query: { difficulty: "easy" },
      body: {},
    } as unknown as NextApiRequest;

    handler(req, mockRes);

    expect(errorSpy).toHaveBeenCalled();
    const [label, msg] = errorSpy.mock.calls[0];
    expect(label).toBe("Sudoku generation error:");
    expect(typeof msg).toBe("string");
    // Must not be an Error object or full stack trace object
    expect(typeof msg).not.toBe("object");
  });

  it("still returns a JSON failure response on GET error", () => {
    const req = {
      method: "GET",
      query: {},
      body: {},
    } as unknown as NextApiRequest;

    handler(req, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});

describe("POST /api/sudoku — error logging", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => void;
  let errorSpy: ReturnType<typeof spyOn>;
  let mockRes: NextApiResponse;

  beforeEach(async () => {
    handler = (await import("./sudoku")).default;
    errorSpy = spyOn(console, "error").mockImplementation(() => undefined);
    errorSpy.mockClear();

    const json = mock();
    mockRes = {
      json,
      status: mock(() => ({ json })),
    } as unknown as NextApiResponse;
  });

  it("logs only the error message on POST error with invalid code", () => {
    const req = {
      method: "POST",
      query: {},
      body: { code: "bad-code" },
    } as unknown as NextApiRequest;

    handler(req, mockRes);

    expect(errorSpy).toHaveBeenCalled();
    const [label, msg] = errorSpy.mock.calls[0];
    expect(label).toBe("Sudoku solve error:");
    expect(typeof msg).toBe("string");
    expect(typeof msg).not.toBe("object");
  });
});
