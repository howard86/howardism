import Sudoku from "@/server/libs/sudoku/model"

describe("sudoku model", () => {
  describe("constructor", () => {
    let validInput: number[]

    beforeEach(() => {
      // prettier-ignore
      validInput = [
        9, 0, 0, 0, 0, 4, 6, 1, 0,
        0, 0, 0, 0, 0, 2, 0, 0, 7,
        0, 0, 3, 0, 0, 9, 0, 0, 2,
        0, 0, 0, 0, 0, 7, 4, 2, 6,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        4, 5, 2, 6, 0, 0, 0, 0, 0,
        8, 0, 0, 1, 0, 0, 2, 0, 0,
        2, 0, 0, 7, 0, 0, 0, 0, 0,
        0, 6, 5, 4, 0, 0, 0, 0, 1
      ]
    })

    it("should create a Sudoku with an array of 81 integers between 1 and 9", () => {
      expect.hasAssertions()
      const sudoku = new Sudoku(validInput)
      expect(sudoku).toBeDefined()
    })

    it("should throw if the array has more lest than 81 integers", () => {
      expect.hasAssertions()
      const invalidInput = validInput.slice(0, 80)
      expect(() => new Sudoku(invalidInput)).toThrow(
        "Incorrect input length=80, input should only contain 81 numbers"
      )
    })

    it("should throw if the array has more more than 81 integers", () => {
      expect.hasAssertions()
      const invalidInput = [...validInput, 2]
      expect(() => new Sudoku(invalidInput)).toThrow(
        "Incorrect input length=82, input should only contain 81 numbers"
      )
    })

    it("should throw if any integer is above 9", () => {
      expect.hasAssertions()
      const invalidInput = [92, ...validInput].slice(0, 81)
      expect(() => new Sudoku(invalidInput)).toThrow("Incorrect input with invalid values=[92]")
    })

    it("should throw if any integer is below 0", () => {
      expect.hasAssertions()
      const invalidInput = [-5, ...validInput].slice(0, 81)
      expect(() => new Sudoku(invalidInput)).toThrow("Incorrect input with invalid values=[-5]")
    })

    it("should throw if any number is float", () => {
      expect.hasAssertions()
      const invalidInput = [1.1, ...validInput].slice(0, 81)
      expect(() => new Sudoku(invalidInput)).toThrow("Incorrect input with invalid values=[1.1]")
    })
  })

  describe("getRow", () => {
    // prettier-ignore
    const validInput = [
        9, 0, 0, 0, 0, 4, 6, 1, 0,
        0, 0, 0, 0, 0, 2, 0, 0, 7,
        0, 0, 3, 0, 0, 9, 0, 0, 2,
        0, 0, 0, 0, 0, 7, 4, 2, 6,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        4, 5, 2, 6, 0, 0, 0, 0, 0,
        8, 0, 0, 1, 0, 0, 2, 0, 0,
        2, 0, 0, 7, 0, 0, 0, 0, 0,
        0, 6, 5, 4, 0, 0, 0, 0, 1
    ]

    const sudoku = new Sudoku(validInput)

    it("should get Row 1", () => {
      expect.hasAssertions()
      expect(sudoku.getRow(1)).toStrictEqual([9, 0, 0, 0, 0, 4, 6, 1, 0])
    })

    it("should get Row 2", () => {
      expect.hasAssertions()
      expect(sudoku.getRow(2)).toStrictEqual([0, 0, 0, 0, 0, 2, 0, 0, 7])
    })

    it("should get Row 3", () => {
      expect.hasAssertions()
      expect(sudoku.getRow(3)).toStrictEqual([0, 0, 3, 0, 0, 9, 0, 0, 2])
    })

    it("should get Row 4", () => {
      expect.hasAssertions()
      expect(sudoku.getRow(4)).toStrictEqual([0, 0, 0, 0, 0, 7, 4, 2, 6])
    })

    it("should get Row 5", () => {
      expect.hasAssertions()
      expect(sudoku.getRow(5)).toStrictEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
    })

    it("should get Row 6", () => {
      expect.hasAssertions()
      expect(sudoku.getRow(6)).toStrictEqual([4, 5, 2, 6, 0, 0, 0, 0, 0])
    })

    it("should get Row 7", () => {
      expect.hasAssertions()
      expect(sudoku.getRow(7)).toStrictEqual([8, 0, 0, 1, 0, 0, 2, 0, 0])
    })

    it("should get Row 8", () => {
      expect.hasAssertions()
      expect(sudoku.getRow(8)).toStrictEqual([2, 0, 0, 7, 0, 0, 0, 0, 0])
    })

    it("should get Row 9", () => {
      expect.hasAssertions()
      expect(sudoku.getRow(9)).toStrictEqual([0, 6, 5, 4, 0, 0, 0, 0, 1])
    })
  })

  describe("getColumn", () => {
    // prettier-ignore
    const validInput = [
        9, 0, 0, 0, 0, 4, 6, 1, 0,
        0, 0, 0, 0, 0, 2, 0, 0, 7,
        0, 0, 3, 0, 0, 9, 0, 0, 2,
        0, 0, 0, 0, 0, 7, 4, 2, 6,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        4, 5, 2, 6, 0, 0, 0, 0, 0,
        8, 0, 0, 1, 0, 0, 2, 0, 0,
        2, 0, 0, 7, 0, 0, 0, 0, 0,
        0, 6, 5, 4, 0, 0, 0, 0, 1
    ]

    const sudoku = new Sudoku(validInput)

    it("should get Column 1", () => {
      expect.hasAssertions()
      expect(sudoku.getColumn(1)).toStrictEqual([9, 0, 0, 0, 0, 4, 8, 2, 0])
    })

    it("should get Column 2", () => {
      expect.hasAssertions()
      expect(sudoku.getColumn(2)).toStrictEqual([0, 0, 0, 0, 0, 5, 0, 0, 6])
    })

    it("should get Column 3", () => {
      expect.hasAssertions()
      expect(sudoku.getColumn(3)).toStrictEqual([0, 0, 3, 0, 0, 2, 0, 0, 5])
    })

    it("should get Column 4", () => {
      expect.hasAssertions()
      expect(sudoku.getColumn(4)).toStrictEqual([0, 0, 0, 0, 0, 6, 1, 7, 4])
    })

    it("should get Column 5", () => {
      expect.hasAssertions()
      expect(sudoku.getColumn(5)).toStrictEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
    })

    it("should get Column 6", () => {
      expect.hasAssertions()
      expect(sudoku.getColumn(6)).toStrictEqual([4, 2, 9, 7, 0, 0, 0, 0, 0])
    })

    it("should get Column 7", () => {
      expect.hasAssertions()
      expect(sudoku.getColumn(7)).toStrictEqual([6, 0, 0, 4, 0, 0, 2, 0, 0])
    })

    it("should get Column 8", () => {
      expect.hasAssertions()
      expect(sudoku.getColumn(8)).toStrictEqual([1, 0, 0, 2, 0, 0, 0, 0, 0])
    })

    it("should get Column 9", () => {
      expect.hasAssertions()
      expect(sudoku.getColumn(9)).toStrictEqual([0, 7, 2, 6, 0, 0, 0, 0, 1])
    })
  })

  describe("getBlock", () => {
    // prettier-ignore
    const validInput = [
        9, 0, 0, 0, 0, 4, 6, 1, 0,
        0, 0, 0, 0, 0, 2, 0, 0, 7,
        0, 0, 3, 0, 0, 9, 0, 0, 2,
        0, 0, 0, 0, 0, 7, 4, 2, 6,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        4, 5, 2, 6, 0, 0, 0, 0, 0,
        8, 0, 0, 1, 0, 0, 2, 0, 0,
        2, 0, 0, 7, 0, 0, 0, 0, 0,
        0, 6, 5, 4, 0, 0, 0, 0, 1
    ]

    const sudoku = new Sudoku(validInput)

    it("should get Block 1", () => {
      expect.hasAssertions()
      expect(sudoku.getBlock(1)).toStrictEqual([9, 0, 0, 0, 0, 0, 0, 0, 3])
    })

    it("should get Block 2", () => {
      expect.hasAssertions()
      expect(sudoku.getBlock(2)).toStrictEqual([0, 0, 4, 0, 0, 2, 0, 0, 9])
    })

    it("should get Block 3", () => {
      expect.hasAssertions()
      expect(sudoku.getBlock(3)).toStrictEqual([6, 1, 0, 0, 0, 7, 0, 0, 2])
    })

    it("should get Block 4", () => {
      expect.hasAssertions()
      expect(sudoku.getBlock(4)).toStrictEqual([0, 0, 0, 0, 0, 0, 4, 5, 2])
    })

    it("should get Block 5", () => {
      expect.hasAssertions()
      expect(sudoku.getBlock(5)).toStrictEqual([0, 0, 7, 0, 0, 0, 6, 0, 0])
    })

    it("should get Block 6", () => {
      expect.hasAssertions()
      expect(sudoku.getBlock(6)).toStrictEqual([4, 2, 6, 0, 0, 0, 0, 0, 0])
    })

    it("should get Block 7", () => {
      expect.hasAssertions()
      expect(sudoku.getBlock(7)).toStrictEqual([8, 0, 0, 2, 0, 0, 0, 6, 5])
    })

    it("should get Block 8", () => {
      expect.hasAssertions()
      expect(sudoku.getBlock(8)).toStrictEqual([1, 0, 0, 7, 0, 0, 4, 0, 0])
    })

    it("should get Block 9", () => {
      expect.hasAssertions()
      expect(sudoku.getBlock(9)).toStrictEqual([2, 0, 0, 0, 0, 0, 0, 0, 1])
    })
  })

  describe("isSolved", () => {
    it("should return true if sudoku is solved", () => {
      expect.hasAssertions()
      const sudoku = new Sudoku(
        // prettier-ignore
        [
          4, 6, 2, 8, 1, 7, 9, 5, 3,
          1, 8, 9, 2, 5, 3, 7, 6, 4,
          7, 3, 5, 6, 9, 4, 1, 2, 8,
          8, 4, 7, 5, 3, 1, 6, 9, 2,
          5, 9, 3, 7, 6, 2, 4, 8, 1,
          6, 2, 1, 9, 4, 8, 5, 3, 7,
          9, 1, 4, 3, 8, 6, 2, 7, 5,
          3, 7, 6, 1, 2, 5, 8, 4, 9,
          2, 5, 8, 4, 7, 9, 3, 1, 6
        ]
      )

      expect(sudoku.isSolved).toBe(true)
    })

    it("should return false if sudoku is not solved", () => {
      expect.hasAssertions()
      const sudokuWithZero = new Sudoku(
        // prettier-ignore
        [
          9, 0, 0, 0, 0, 4, 6, 1, 0,
          0, 0, 0, 0, 0, 2, 0, 0, 7,
          0, 0, 3, 0, 0, 9, 0, 0, 2,
          0, 0, 0, 0, 0, 7, 4, 2, 6,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
          4, 5, 2, 6, 0, 0, 0, 0, 0,
          8, 0, 0, 1, 0, 0, 2, 0, 0,
          2, 0, 0, 7, 0, 0, 0, 0, 0,
          0, 6, 5, 4, 0, 0, 0, 0, 1
        ]
      )

      expect(sudokuWithZero.isSolved).toBe(false)

      const sudokuWithRepeatedNumber = new Sudoku(
        // prettier-ignore
        [
          4, 6, 2, 8, 1, 7, 9, 5, 3,
          1, 8, 9, 2, 5, 3, 7, 6, 4,
          7, 3, 5, 6, 9, 4, 1, 2, 8,
          8, 4, 7, 5, 3, 1, 6, 9, 2,
          5, 9, 3, 7, 6, 2, 4, 8, 1,
          6, 2, 1, 9, 4, 8, 5, 3, 7,
          9, 1, 4, 3, 8, 6, 4, 7, 5, // 4 repeated here
          3, 7, 6, 1, 2, 5, 8, 2, 9, // 2 repeated here
          2, 5, 8, 4, 7, 9, 3, 1, 6
        ]
      )

      expect(sudokuWithRepeatedNumber.isSolved).toBe(false)
    })
  })

  describe("sudoku.from", () => {
    it("should return the same number array with encoded input", () => {
      expect.hasAssertions()
      const sudoku = new Sudoku(
        // prettier-ignore
        [
          4, 6, 2, 8, 1, 7, 9, 5, 3,
          1, 8, 9, 2, 5, 3, 7, 6, 4,
          7, 3, 5, 6, 9, 4, 1, 2, 8,
          8, 4, 7, 5, 3, 1, 6, 9, 2,
          5, 9, 3, 7, 6, 2, 4, 8, 1,
          6, 2, 1, 9, 4, 8, 5, 3, 7,
          9, 1, 4, 3, 8, 6, 2, 7, 5,
          3, 7, 6, 1, 2, 5, 8, 4, 9,
          2, 5, 8, 4, 7, 9, 3, 1, 6
        ]
      )

      expect.hasAssertions()
      expect(Sudoku.from(sudoku.encodedInput)).toStrictEqual(sudoku)
    })
  })
})
