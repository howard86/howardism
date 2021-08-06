import type { NextApiRequest, NextApiResponse } from "next";

import {
  generate,
  generateBaseOnDifficulty,
  solve,
  Sudoku,
  SudokuDifficulty,
} from "@/server/libs/sudoku";

interface SudokuApiRequest extends NextApiRequest {
  query: {
    difficulty?: SudokuDifficulty;
    code?: string;
  };
  body: {
    sudoku?: number[];
    code?: string;
  };
}

export type SudokuApiResponse = SudokuSuccessApiResponse | SudokuFailureApiResponse;

type SudokuSuccessApiResponse = {
  success: true;
  difficulty: SudokuDifficulty;
  code: string;
  sudoku: number[];
};

type SudokuFailureApiResponse = {
  success: false;
  message: string;
};

const handler = (req: SudokuApiRequest, res: NextApiResponse<SudokuApiResponse>) => {
  switch (req.method) {
    case "GET": {
      const { code, difficulty } = req.query;

      let sudoku: Sudoku;

      if (code) {
        try {
          sudoku = Sudoku.from(code);
        } catch (error) {
          console.error(error);
          return res.json({
            success: false,
            message: `Invalid code with ${code}`,
          });
        }
      } else if (
        difficulty &&
        Object.keys(SudokuDifficulty).some((key) => key.toLowerCase() === difficulty)
      ) {
        sudoku = generateBaseOnDifficulty(difficulty);
      } else {
        sudoku = generate();
      }

      return res.json({
        success: true,
        difficulty: sudoku.difficulty,
        code: sudoku.encodedInput,
        sudoku: sudoku.input,
      });
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
          throw new Error(`Invalid input with ${JSON.stringify(req.body)}`);
        }

        return res.json({
          success: true,
          difficulty: newSudoku.difficulty,
          code: newSudoku.encodedInput,
          sudoku: solve(newSudoku).input,
        });
      } catch (error) {
        console.error(error);
        return res.json({
          success: false,
          message: error.message,
        });
      }
    }

    default:
      console.error(`Accessing invalid method ${req.method}`);
      return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
};

export default handler;
