import { SimpleLayout } from "@/app/(common)/SimpleLayout";

import SudokuGame from "./SudokuGame";

export default function SudokuPage() {
  return (
    <SimpleLayout
      intro="A handmade Sudoku game randomly generated via difficulty"
      title="Sudoku Game"
    >
      <SudokuGame />
    </SimpleLayout>
  );
}
