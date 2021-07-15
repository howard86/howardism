import type { NextApiRequest, NextApiResponse } from "next";

import { generate, solve, Sudoku } from "@/server/libs/sudoku";

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "GET":
      // TODO: add sudoku generator
      return res.status(200).json({
        success: true,
        sudoku: generate(),
      });

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
          sudoku: solve(sudoku),
        });
      } catch (error) {
        return res.json({
          success: false,
          message: error.message,
        });
      }
    }

    default:
      return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
};

export default handler;
