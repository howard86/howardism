import type { NextApiRequest, NextApiResponse } from "next";

import {
  generateSudoku,
  Sudoku,
  SudokuDifficulty,
  solve,
} from "@/server/libs/sudoku";

interface SudokuApiRequest extends NextApiRequest {
  body: {
    sudoku?: number[];
    code?: string;
  };
  query: {
    difficulty?: SudokuDifficulty;
    code?: string;
  };
}

export type SudokuApiResponse =
  | SudokuSuccessApiResponse
  | SudokuFailureApiResponse;

interface SudokuSuccessApiResponse {
  code: string;
  difficulty: SudokuDifficulty;
  success: true;
  sudoku: number[];
}

interface SudokuFailureApiResponse {
  message: string;
  success: false;
}

const handler = (
  req: SudokuApiRequest,
  res: NextApiResponse<SudokuApiResponse>
) => {
  switch (req.method) {
    case "GET": {
      const { code, difficulty } = req.query;

      try {
        if (
          difficulty &&
          !Object.values(SudokuDifficulty).includes(difficulty)
        ) {
          throw new Error("Invalid difficulty");
        }

        const sudoku = generateSudoku(code, difficulty);

        return res.json({
          success: true,
          difficulty: sudoku.difficulty,
          code: sudoku.encodedInput,
          sudoku: sudoku.input,
        });
      } catch (error) {
        console.error("Sudoku generation error:", (error as Error).message);
        return res.json({
          success: false,
          message: "Failed to generate sudoku",
        });
      }
    }

    case "POST": {
      const { sudoku, code } = req.body;

      let newSudoku: Sudoku;

      try {
        if (sudoku) {
          newSudoku = new Sudoku(sudoku);
        } else if (code) {
          newSudoku = Sudoku.from(code);
        } else {
          throw new Error(
            "Invalid input: body must contain 'sudoku' (array) or 'code' (string)"
          );
        }

        return res.json({
          success: true,
          difficulty: newSudoku.difficulty,
          code: newSudoku.encodedInput,
          sudoku: solve(newSudoku).input,
        });
      } catch (error) {
        console.error("Sudoku solve error:", (error as Error).message);
        return res.json({
          success: false,
          message: "Failed to solve sudoku",
        });
      }
    }

    default:
      console.error(`Accessing invalid method ${req.method}`);
      return res
        .status(405)
        .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
};

export default handler;
