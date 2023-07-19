/* eslint-disable no-param-reassign */

import { sampleSize } from "@/utils/array"

import { SudokuDifficulty } from "./enum"
import Sudoku from "./model"

export enum SudokuStatus {
  Unsolvable,
  UniqueSolution,
  MultipleSolutions,
}

const ITERATION_MAX_COUNT = 1000
const DIMENSION = 9
const INITIAL_INDEXES = Array.from<number>({
  length: Sudoku.VALID_INPUT_LENGTH,
})
  .fill(0)
  .map((_, index) => index)

const isRepeated = (
  sudoku: Sudoku,
  rowNumber: number,
  columnNumber: number,
  insertNumber: number,
) =>
  sudoku.getRow(rowNumber).includes(insertNumber) ||
  sudoku.getColumn(columnNumber).includes(insertNumber) ||
  sudoku
    .getBlock(3 * Math.floor((rowNumber - 1) / 3) + Math.floor((columnNumber - 1) / 3) + 1)
    .includes(insertNumber)

// This will mutate internal Sudoku class
const iterate = (sudoku: Sudoku, rowNumber = 1, columnNumber = 1): boolean => {
  if (rowNumber === DIMENSION && columnNumber === DIMENSION) {
    // as this stops at last number, need to check if its filled
    if (sudoku.getNumber(DIMENSION, DIMENSION) !== 0) {
      return true
    }

    const lastRow = sudoku.getRow(DIMENSION)
    for (const numberInput of Sudoku.ARRAY_FROM_ONE_TO_NINE) {
      if (!lastRow.includes(numberInput)) {
        sudoku.setNumber(DIMENSION, DIMENSION, numberInput)
        break
      }
    }
    return true
  }

  if (columnNumber > DIMENSION) {
    rowNumber += 1
    columnNumber = 0
  }

  if (sudoku.getNumber(rowNumber, columnNumber) !== 0) {
    return iterate(sudoku, rowNumber, columnNumber + 1)
  }

  for (const randomNumberInput of sampleSize(Sudoku.ARRAY_FROM_ONE_TO_NINE)) {
    if (!isRepeated(sudoku, rowNumber, columnNumber, randomNumberInput)) {
      sudoku.setNumber(rowNumber, columnNumber, randomNumberInput)

      // check if it's solved
      if (iterate(sudoku, rowNumber, columnNumber + 1)) {
        return true
      }

      // else not solved, skip this i
      sudoku.setNumber(rowNumber, columnNumber, 0)
    }
  }

  return false
}

export const solve = (sudoku: Sudoku): Sudoku => {
  if (sudoku.isSolved) {
    return sudoku
  }

  // input getter creates a copy of numberArray
  const sudokuCopy = new Sudoku(sudoku.input)

  if (!iterate(sudokuCopy)) {
    throw new Error("Sudoku is not solvable")
  }

  return sudokuCopy
}

/**
 * Calculate number of solutions of Sudoku, stops if exceed 2
 * @remarks this is similar to iterate method but
 *          returns number and wont generate a solved sudoku
 */
const getNumberOfSolutions = (
  sudoku: Sudoku,
  rowNumber = 1,
  columnNumber = 1,
  count = 0,
): number => {
  if (rowNumber === DIMENSION && columnNumber === DIMENSION) {
    return count + 1
  }

  if (columnNumber > DIMENSION) {
    rowNumber += 1
    columnNumber = 0
  }

  if (sudoku.getNumber(rowNumber, columnNumber) !== 0) {
    return getNumberOfSolutions(sudoku, rowNumber, columnNumber + 1, count)
  }

  for (const randomNumberInput of sampleSize(Sudoku.ARRAY_FROM_ONE_TO_NINE)) {
    if (count > 1) {
      break
    }

    if (!isRepeated(sudoku, rowNumber, columnNumber, randomNumberInput)) {
      sudoku.setNumber(rowNumber, columnNumber, randomNumberInput)
      count = getNumberOfSolutions(sudoku, rowNumber, columnNumber + 1, count)
      // reset backtracking
      sudoku.setNumber(rowNumber, columnNumber, 0)
    }
  }

  return count
}

export const getSudokuStatus = (sudoku: Sudoku): SudokuStatus => {
  const count = getNumberOfSolutions(sudoku)

  switch (count) {
    case 0:
      return SudokuStatus.Unsolvable

    case 1:
      return SudokuStatus.UniqueSolution

    case 2:
      return SudokuStatus.MultipleSolutions

    default:
      throw new Error(`Invalid ${getNumberOfSolutions.name} with count=${count}`)
  }
}

export const generateFullBoard = (): Sudoku => {
  const emptyBoard = new Sudoku(Array.from<number>({ length: Sudoku.VALID_INPUT_LENGTH }).fill(0))
  return solve(emptyBoard)
}

export const generate = (): Sudoku => {
  const solution = generateFullBoard()
  const removedIndexes = sampleSize(INITIAL_INDEXES)

  const resultInput = solution.input
  for (const removedIndex of removedIndexes) {
    const originalNumber = resultInput[removedIndex]
    resultInput[removedIndex] = 0

    // we stop when we have more than 1 solution
    if (getNumberOfSolutions(new Sudoku(resultInput)) > 1) {
      resultInput[removedIndex] = originalNumber
      break
    }
  }

  return new Sudoku(resultInput)
}

export const generateBaseOnDifficulty = (level: SudokuDifficulty): Sudoku => {
  let count = 0

  while (count < ITERATION_MAX_COUNT) {
    count += 1
    const sudoku = generate()

    if (sudoku.difficulty === level) {
      // eslint-disable-next-line no-console
      console.log(`Took ${count} times to generate sudoku with difficulty=${level}`)
      return sudoku
    }
  }

  throw new Error(`Failed to generate after iteration over ${count} times`)
}

export const generateSudoku = (code?: string, difficulty?: SudokuDifficulty): Sudoku => {
  if (code) {
    return Sudoku.from(code)
  }

  if (difficulty) {
    return generateBaseOnDifficulty(difficulty)
  }

  return generate()
}
