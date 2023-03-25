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

describe("sudoku service", () => {
  describe("solve", () => {
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
      expect.hasAssertions()
      const result = solve(sudoku)

      expect(result.isSolved).toBe(true)

      Sudoku.ARRAY_FROM_ONE_TO_NINE.forEach((num) => {
        expect(result.getRow(num).sort()).toStrictEqual(Sudoku.ARRAY_FROM_ONE_TO_NINE)
        expect(result.getColumn(num).sort()).toStrictEqual(Sudoku.ARRAY_FROM_ONE_TO_NINE)
        expect(result.getBlock(num).sort()).toStrictEqual(Sudoku.ARRAY_FROM_ONE_TO_NINE)
      })
    })
  })

  describe("generateFullBoard", () => {
    it("should be solved", () => {
      expect.hasAssertions()
      const result = generateFullBoard()
      expect(result.isSolved).toBe(true)
    })
  })

  describe("getSudokuStatus", () => {
    it("should return 0 for sudoku without solutions", () => {
      expect.hasAssertions()
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
      expect.hasAssertions()
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
      expect.hasAssertions()
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

  describe("generate", () => {
    it("should generate a sudoku with unique solution", () => {
      expect.hasAssertions()
      const result = generate()
      expect(getSudokuStatus(result)).toBe(SudokuStatus.UniqueSolution)
    })
  })

  describe("generateBaseOnDifficulty", () => {
    it("should generate a sudoku with beginner level", () => {
      expect.hasAssertions()
      const result = generateBaseOnDifficulty(SudokuDifficulty.Beginner)
      expect(getSudokuStatus(result)).toBe(SudokuStatus.UniqueSolution)
    })

    it("should generate a sudoku with medium level", () => {
      expect.hasAssertions()
      const result = generateBaseOnDifficulty(SudokuDifficulty.Medium)
      expect(getSudokuStatus(result)).toBe(SudokuStatus.UniqueSolution)
    })

    it("should generate a sudoku with hard level", () => {
      expect.hasAssertions()
      const result = generateBaseOnDifficulty(SudokuDifficulty.Hard)
      expect(getSudokuStatus(result)).toBe(SudokuStatus.UniqueSolution)
    })

    it("should generate a sudoku with expert level", () => {
      expect.hasAssertions()
      const result = generateBaseOnDifficulty(SudokuDifficulty.Expert)
      expect(getSudokuStatus(result)).toBe(SudokuStatus.UniqueSolution)
    })
  })
})
