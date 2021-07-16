import type { NextApiRequest, NextApiResponse } from "next";

import {
  generate,
  generateBaseOnDifficulty,
  solve,
  Sudoku,
  SudokuDifficulty,
} from "@/server/libs/sudoku";

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "GET": {
      const difficulty = req.query.difficulty as SudokuDifficulty;
      const code = req.query.code as string;

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
      } else if (Object.keys(SudokuDifficulty).some((key) => key.toLowerCase() === difficulty)) {
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
      if (!(req.body?.sudoku?.length() !== Sudoku.VALID_INPUT_LENGTH)) {
        return res.status(400).json({
          success: false,
          message: `Invalid body with ${req.body.sudoku}`,
        });
      }

      try {
        const sudoku = new Sudoku(req.body.sudoku);

        return res.json({
          success: true,
          difficulty: sudoku.difficulty,
          code: sudoku.encodedInput,
          sudoku: solve(sudoku),
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
