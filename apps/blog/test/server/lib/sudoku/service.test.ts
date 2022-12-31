import { SudokuDifficulty } from "@/server/libs/sudoku/enum"
import Sudoku from "@/server/libs/sudoku/model"
import {
  generate,
  generateBaseOnDifficulty,
  generateFullBoard,
  getSudokuStatus,
  solve,
  SudokuStatus,
} from "@/server/libs/sudoku/service"

describe("Sudoku service", () => {
  describe(solve.name, () => {
    let sudoku: Sudoku

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
    })

    it("should return a solved sudoku", () => {
      const result = solve(sudoku)

      expect(result.isSolved).toBe(true)

      Sudoku.ARRAY_FROM_ONE_TO_NINE.forEach((num) => {
        expect(result.getRow(num).sort()).toEqual(Sudoku.ARRAY_FROM_ONE_TO_NINE)
        expect(result.getColumn(num).sort()).toEqual(Sudoku.ARRAY_FROM_ONE_TO_NINE)
        expect(result.getBlock(num).sort()).toEqual(Sudoku.ARRAY_FROM_ONE_TO_NINE)
      })
    })
  })

  describe(generateFullBoard.name, () => {
    it("should be solved", () => {
      const result = generateFullBoard()
      expect(result.isSolved).toBe(true)
    })
  })

  describe(getSudokuStatus.name, () => {
    it("should return 0 for sudoku without solutions", () => {
      // prettier-ignore
      const sudoku = new Sudoku([
        9, 9, 0, 0, 0, 4, 6, 1, 0,
        0, 0, 0, 0, 0, 2, 0, 0, 7,
        0, 0, 3, 0, 0, 9, 0, 0, 2,
        0, 0, 0, 0, 0, 7, 4, 2, 6,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        4, 5, 2, 6, 0, 0, 0, 0, 0,
        8, 0, 0, 1, 0, 0, 2, 0, 0,
        2, 0, 0, 7, 0, 0, 0, 0, 0,
        0, 6, 5, 4, 0, 0, 0, 0, 1
      ]);
      const status = getSudokuStatus(sudoku)
      expect(status).toBe(SudokuStatus.Unsolvable)
    })

    it("should return 1 for sudoku with unique solution", () => {
      // prettier-ignore
      const sudoku = new Sudoku([
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
      const status = getSudokuStatus(sudoku)
      expect(status).toBe(SudokuStatus.UniqueSolution)
    })

    it("should return 2 for sudoku with more than 1 solutions", () => {
      // prettier-ignore
      const sudoku = new Sudoku([
        0, 0, 0, 0, 0, 4, 6, 1, 0,
        0, 0, 0, 0, 0, 2, 0, 0, 7,
        0, 0, 3, 0, 0, 9, 0, 0, 2,
        0, 0, 0, 0, 0, 7, 4, 2, 6,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        4, 5, 2, 6, 0, 0, 0, 0, 0,
        8, 0, 0, 1, 0, 0, 2, 0, 0,
        2, 0, 0, 7, 0, 0, 0, 0, 0,
        0, 6, 5, 4, 0, 0, 0, 0, 1
      ]);
      const status = getSudokuStatus(sudoku)
      expect(status).toBe(SudokuStatus.MultipleSolutions)
    })
  })

  describe(generate.name, () => {
    it("should generate a sudoku with unique solution", () => {
      const result = generate()
      expect(getSudokuStatus(result)).toBe(SudokuStatus.UniqueSolution)
    })
  })

  describe(generateBaseOnDifficulty.name, () => {
    it("should generate a sudoku with beginner level", () => {
      const result = generateBaseOnDifficulty(SudokuDifficulty.Beginner)
      expect(getSudokuStatus(result)).toBe(SudokuStatus.UniqueSolution)
    })

    it("should generate a sudoku with medium level", () => {
      const result = generateBaseOnDifficulty(SudokuDifficulty.Medium)
      expect(getSudokuStatus(result)).toBe(SudokuStatus.UniqueSolution)
    })

    it("should generate a sudoku with hard level", () => {
      const result = generateBaseOnDifficulty(SudokuDifficulty.Hard)
      expect(getSudokuStatus(result)).toBe(SudokuStatus.UniqueSolution)
    })

    it("should generate a sudoku with expert level", () => {
      const result = generateBaseOnDifficulty(SudokuDifficulty.Expert)
      expect(getSudokuStatus(result)).toBe(SudokuStatus.UniqueSolution)
    })
  })
})
