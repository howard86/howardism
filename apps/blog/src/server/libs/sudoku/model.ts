export default class Sudoku {
  readonly VALID_INPUT_LENGTH = 81;
  readonly ARRAY_FROM_ONE_TO_NINE = new Array(9).fill(0).map((_, i) => i + 1);

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
   * Construct a game of Sudoku by an array of valid integers
   *
   * @remarks all values between x and y are inclusive
   *
   * @returns a copy of numberInput
   */
  get input(): number[] {
    return [...this.numberArray];
  }

  get isSolved(): boolean {
    // as Row, Column & Block will always have 9 integers
    return this.ARRAY_FROM_ONE_TO_NINE.every(
      (i) =>
        this.ARRAY_FROM_ONE_TO_NINE.every((num) => this.getRow(i).includes(num)) &&
        this.ARRAY_FROM_ONE_TO_NINE.every((num) => this.getColumn(i).includes(num)) &&
        this.ARRAY_FROM_ONE_TO_NINE.every((num) => this.getBlock(i).includes(num))
    );
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
    return this.ARRAY_FROM_ONE_TO_NINE.map((i) => this.numberArray[n + 9 * i - 10]);
  }

  /**
   * Returns the indexes of block n within the input
   *
   * @param n - an integer between 1 and 9
   * @returns an array of 9 integers between 0 and 9
   */
  getBlock(n: number): number[] {
    return this.ARRAY_FROM_ONE_TO_NINE.map(
      (i) =>
        this.numberArray[
          Math.floor((n - 1) / 3) * 27 +
            3 * ((n - 1) % 3) +
            Math.floor((i - 1) / 3) * 9 +
            ((i - 1) % 3)
        ]
    );
  }

  private validateInput(input: number[]) {
    if (input.length !== this.VALID_INPUT_LENGTH) {
      throw new Error(
        `Incorrect input length=${input.length}, input should only contain ${this.VALID_INPUT_LENGTH} numbers`
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
