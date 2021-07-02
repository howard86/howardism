import Sudoku from "@/server/libs/sudoku/model";

describe("Sudoku model", () => {
  describe("constructor", () => {
    let validInput: number[];

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
    });

    it("should create a Sudoku with an array of 81 integers between 1 and 9", () => {
      const sudoku = new Sudoku(validInput);
      expect(sudoku).toBeDefined();
    });

    it("should throw if the array has more lest than 81 integers", () => {
      const invalidInput = validInput.slice(0, 80);
      expect(() => new Sudoku(invalidInput));
    });

    it("should throw if the array has more more than 81 integers", () => {
      const invalidInput = [...validInput, 2];
      expect(() => new Sudoku(invalidInput));
    });

    it("should throw if any integer is above 9", () => {
      const invalidInput = [92, ...validInput].slice(0, 81);
      expect(() => new Sudoku(invalidInput));
    });

    it("should throw if any integer is below 0", () => {
      const invalidInput = [-5, ...validInput].slice(0, 81);
      expect(() => new Sudoku(invalidInput));
    });

    it("should throw if any number is float", () => {
      const invalidInput = [1.1, ...validInput].slice(0, 81);
      expect(() => new Sudoku(invalidInput));
    });
  });

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

    const sudoku = new Sudoku(validInput);

    it("should get Row 1", () => {
      expect(sudoku.getRow(1)).toEqual([9, 0, 0, 0, 0, 4, 6, 1, 0]);
    });

    it("should get Row 2", () => {
      expect(sudoku.getRow(2)).toEqual([0, 0, 0, 0, 0, 2, 0, 0, 7]);
    });

    it("should get Row 3", () => {
      expect(sudoku.getRow(3)).toEqual([0, 0, 3, 0, 0, 9, 0, 0, 2]);
    });

    it("should get Row 4", () => {
      expect(sudoku.getRow(4)).toEqual([0, 0, 0, 0, 0, 7, 4, 2, 6]);
    });

    it("should get Row 5", () => {
      expect(sudoku.getRow(5)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    });

    it("should get Row 6", () => {
      expect(sudoku.getRow(6)).toEqual([4, 5, 2, 6, 0, 0, 0, 0, 0]);
    });

    it("should get Row 7", () => {
      expect(sudoku.getRow(7)).toEqual([8, 0, 0, 1, 0, 0, 2, 0, 0]);
    });

    it("should get Row 8", () => {
      expect(sudoku.getRow(8)).toEqual([2, 0, 0, 7, 0, 0, 0, 0, 0]);
    });

    it("should get Row 9", () => {
      expect(sudoku.getRow(9)).toEqual([0, 6, 5, 4, 0, 0, 0, 0, 1]);
    });
  });

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

    const sudoku = new Sudoku(validInput);

    it("should get Column 1", () => {
      expect(sudoku.getColumn(1)).toEqual([9, 0, 0, 0, 0, 4, 8, 2, 0]);
    });

    it("should get Column 2", () => {
      expect(sudoku.getColumn(2)).toEqual([0, 0, 0, 0, 0, 5, 0, 0, 6]);
    });

    it("should get Column 3", () => {
      expect(sudoku.getColumn(3)).toEqual([0, 0, 3, 0, 0, 2, 0, 0, 5]);
    });

    it("should get Column 4", () => {
      expect(sudoku.getColumn(4)).toEqual([0, 0, 0, 0, 0, 6, 1, 7, 4]);
    });

    it("should get Column 5", () => {
      expect(sudoku.getColumn(5)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    });

    it("should get Column 6", () => {
      expect(sudoku.getColumn(6)).toEqual([4, 2, 9, 7, 0, 0, 0, 0, 0]);
    });

    it("should get Column 7", () => {
      expect(sudoku.getColumn(7)).toEqual([6, 0, 0, 4, 0, 0, 2, 0, 0]);
    });

    it("should get Column 8", () => {
      expect(sudoku.getColumn(8)).toEqual([1, 0, 0, 2, 0, 0, 0, 0, 0]);
    });

    it("should get Column 9", () => {
      expect(sudoku.getColumn(9)).toEqual([0, 7, 2, 6, 0, 0, 0, 0, 1]);
    });
  });

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

    const sudoku = new Sudoku(validInput);

    it("should get Block 1", () => {
      expect(sudoku.getBlock(1)).toEqual([9, 0, 0, 0, 0, 0, 0, 0, 3]);
    });

    it("should get Block 2", () => {
      expect(sudoku.getBlock(2)).toEqual([0, 0, 4, 0, 0, 2, 0, 0, 9]);
    });

    it("should get Block 3", () => {
      expect(sudoku.getBlock(3)).toEqual([6, 1, 0, 0, 0, 7, 0, 0, 2]);
    });

    it("should get Block 4", () => {
      expect(sudoku.getBlock(4)).toEqual([0, 0, 0, 0, 0, 0, 4, 5, 2]);
    });

    it("should get Block 5", () => {
      expect(sudoku.getBlock(5)).toEqual([0, 0, 7, 0, 0, 0, 6, 0, 0]);
    });

    it("should get Block 6", () => {
      expect(sudoku.getBlock(6)).toEqual([4, 2, 6, 0, 0, 0, 0, 0, 0]);
    });

    it("should get Block 7", () => {
      expect(sudoku.getBlock(7)).toEqual([8, 0, 0, 2, 0, 0, 0, 6, 5]);
    });

    it("should get Block 8", () => {
      expect(sudoku.getBlock(8)).toEqual([1, 0, 0, 7, 0, 0, 4, 0, 0]);
    });

    it("should get Block 9", () => {
      expect(sudoku.getBlock(9)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 1]);
    });
  });

  describe("isSolved", () => {
    it("should return true if sudoku is solved", () => {
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
      );

      expect(sudoku.isSolved).toBe(true);
    });

    it("should return false if sudoku is not solved", () => {
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
      );

      expect(sudokuWithZero.isSolved).toBe(false);

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
      );

      expect(sudokuWithRepeatedNumber.isSolved).toBe(false);
    });
  });
});
