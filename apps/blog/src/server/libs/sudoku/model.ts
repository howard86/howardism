export default class Sudoku {
  static readonly VALID_INPUT_LENGTH = 81;
  static readonly ARRAY_FROM_ONE_TO_NINE = new Array(9).fill(0).map((_, i) => i + 1);

  static from(code: string): Sudoku {
    return new this(
      Buffer.from(code, "base64")
        .toString()
        .split("")
        .map((char) => parseInt(char, 10))
    );
  }

  /**
   * Construct a game of Sudoku by an array of valid integers
   *
   * @remarks all values between x and y are inclusive
   *
   * @param numberArray - an array of 81 integers between 1 and 9
   */
  constructor(private readonly numberArray: number[]) {
    this.validateInput(numberArray);
  }

  /**
   * Shallow copy the Sudoku numbers
   *
   * @returns a copy of numberInput
   */
  get input(): number[] {
    return [...this.numberArray];
  }

  /**
   * Check if this Sudoku is solved
   *
   * @returns true if it is solved, otherwise false
   */
  get isSolved(): boolean {
    // as Row, Column & Block will always have 9 integers
    return Sudoku.ARRAY_FROM_ONE_TO_NINE.every(
      (i) =>
        Sudoku.ARRAY_FROM_ONE_TO_NINE.every((num) => this.getRow(i).includes(num)) &&
        Sudoku.ARRAY_FROM_ONE_TO_NINE.every((num) => this.getColumn(i).includes(num)) &&
        Sudoku.ARRAY_FROM_ONE_TO_NINE.every((num) => this.getBlock(i).includes(num))
    );
  }

  /**
   * Get number of zeros in the numberArray
   *
   * @returns number of zeros
   */
  get zeroCount(): number {
    return this.numberArray.filter((num) => num === 0).length;
  }

  /**
   * Get encoded string of numberArray in base 64
   *
   * @returns base4 string
   */
  get encodedInput(): string {
    return Buffer.from(this.numberArray.join("")).toString("base64");
  }

  /**
   * Returns the indexes of row n within the input
   *
   * @param n - an integer between 1 and 9
   * @returns an array of 9 integers between 0 and 9
   */
  getRow(n: number): number[] {
    return this.numberArray.slice(9 * n - 9, 9 * n);
  }

  /**
   * Returns the indexes of column n within the input
   *
   * @param n - an integer between 1 and 9
   * @returns an array of 9 integers between 0 and 9
   */
  getColumn(n: number): number[] {
    return Sudoku.ARRAY_FROM_ONE_TO_NINE.map((i) => this.numberArray[n + 9 * i - 10]);
  }

  /**
   * Returns the indexes of block n within the input
   *
   * @param n - an integer between 1 and 9
   * @returns an array of 9 integers between 0 and 9
   */
  getBlock(n: number): number[] {
    return Sudoku.ARRAY_FROM_ONE_TO_NINE.map(
      (i) =>
        this.numberArray[
          Math.floor((n - 1) / 3) * 27 +
            3 * ((n - 1) % 3) +
            Math.floor((i - 1) / 3) * 9 +
            ((i - 1) % 3)
        ]
    );
  }

  /**
   * Returns number at (row, column)
   *
   * @param rowIndex - row index as an integer between 1 and 9
   * @param columnIndex - column index as an integer between 1 and 9
   * @returns an integer between 0 and 9
   */
  getNumber(rowIndex: number, columnIndex: number): number {
    return this.numberArray[9 * rowIndex + columnIndex - 10];
  }

  /**
   * Update (mutate) number at (row, column)
   *
   * @param rowIndex - row index as an integer between 1 and 9
   * @param columnIndex - column index as an integer between 1 and 9
   * @param num - an integer between 1 and 9
   */
  setNumber(rowIndex: number, columnIndex: number, num: number): void {
    this.numberArray[9 * rowIndex + columnIndex - 10] = num;
  }

  private validateInput(input: number[]) {
    if (input.length !== Sudoku.VALID_INPUT_LENGTH) {
      throw new Error(
        `Incorrect input length=${input.length}, input should only contain ${Sudoku.VALID_INPUT_LENGTH} numbers`
      );
    }

    const invalidInput = input.filter(
      (number) => number < 0 || number > 9 || !Number.isSafeInteger(number)
    );

    if (invalidInput.length > 0) {
      throw new Error(`Incorrect input with invalid values=[${invalidInput.join(", ")}]`);
    }
  }
}
