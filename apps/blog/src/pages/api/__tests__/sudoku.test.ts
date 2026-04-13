import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextApiRequest, NextApiResponse } from "next";

// Mock the sudoku library before importing the handler, matching the pattern from
// test/api/sudoku.test.ts. The critical POST code path (neither sudoku nor code
// field present) reaches the throw before touching any library function, but the
// module must still be resolvable.
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

describe("POST /api/sudoku — request body not echoed in error responses (#525)", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => void;

  beforeEach(async () => {
    handler = (await import("@/pages/api/sudoku")).default;
  });

  it("response body does not contain request body contents when neither sudoku nor code is provided", () => {
    const json = mock();

    const mockRes = {
      json,
      status: mock(() => ({ json })),
      setHeader: mock(),
      end: mock(),
      headersSent: false,
    } as unknown as NextApiResponse;

    const req = {
      method: "POST",
      url: "/api/sudoku",
      query: {},
      body: { canary: "leak-me-525-sudoku" },
    } as unknown as NextApiRequest;

    handler(req, mockRes);

    expect(json).toHaveBeenCalled();
    const responseBody = json.mock.calls[0]?.[0] as Record<string, unknown>;
    const bodyStr = JSON.stringify(responseBody);
    // Response body must never echo raw request body contents
    expect(bodyStr).not.toContain("leak-me-525-sudoku");
    expect(bodyStr).not.toContain("req.body");
  });
});
