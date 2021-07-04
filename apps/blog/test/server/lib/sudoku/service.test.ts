import Sudoku from "@/server/libs/sudoku/model";
import { solve } from "@/server/libs/sudoku/service";

describe("Sudoku service", () => {
  describe(solve.name, () => {
    let sudoku: Sudoku;

    beforeEach(() => {
      // prettier-ignore
      sudoku = new Sudoku([
        9, 0, 0, 0, 0, 4, 6, 1, 0,
        0, 0, 0, 0, 0, 2, 0, 0, 7,
        0, 0, 3, 0, 0, 9, 0, 0, 2,
        0, 0, 0, 0, 0, 7, 4, 2, 6,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        4, 5, 2, 6, 0, 0, 0, 0, 0,
        8, 0, 0, 1, 0, 0, 2, 0, 0,
        2, 0, 0, 7, 0, 0, 0, 0, 0,
        0, 6, 5, 4, 0, 0, 0, 0, 1
      ]);
    });

    it("should return a solved sudoku", () => {
      const result = solve(sudoku);

      expect(result.isSolved).toBe(true);

      result.ARRAY_FROM_ONE_TO_NINE.forEach((num) => {
        expect(result.getRow(num).sort()).toEqual(result.ARRAY_FROM_ONE_TO_NINE);
        expect(result.getColumn(num).sort()).toEqual(result.ARRAY_FROM_ONE_TO_NINE);
        expect(result.getBlock(num).sort()).toEqual(result.ARRAY_FROM_ONE_TO_NINE);
      });
    });
  });
});
