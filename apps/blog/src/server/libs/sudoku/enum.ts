export const SudokuDifficulty = {
  Beginner: "beginner",
  Medium: "medium",
  Hard: "hard",
  Expert: "expert",
} as const;
export type SudokuDifficulty =
  (typeof SudokuDifficulty)[keyof typeof SudokuDifficulty];
