"use client";

import { Button } from "@howardism/ui/components/button";
import { cn } from "@howardism/ui/lib/utils";

import { SUDOKU_DIFFICULTIES } from "./constants";
import useSudoku from "./useSudoku";

const numberArray = new Array(9).fill(0).map((_, index) => index + 1);

export default function SudokuGame() {
  const {
    loading,
    selected,
    onStart,
    answer,
    game,
    message,
    onSelect,
    onUpdate,
  } = useSudoku();

  return (
    <div className="flex flex-col items-center justify-center">
      <details className="dropdown">
        <summary
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm",
            loading && "pointer-events-none opacity-50"
          )}
        >
          Start new game
        </summary>
        <ul className="menu dropdown-content w-52 rounded-box bg-background p-2 shadow">
          {SUDOKU_DIFFICULTIES.map((key) => (
            <li key={key}>
              <button
                className="capitalize"
                onClick={() => onStart(key)}
                type="button"
              >
                {key}
              </button>
            </li>
          ))}
        </ul>
      </details>
      {!loading && (
        <section className="mt-12 flex flex-col items-center">
          <div className="grid grid-cols-9 grid-rows-9">
            {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: sudoku grid rendering with many conditional border classes */}
            {answer.map((cell, index) => {
              const getCellBg = () => {
                if (selected === index) {
                  return "bg-muted";
                }
                if (game[index] > 0) {
                  return "bg-muted/50";
                }
                return "bg-background";
              };

              return (
                <button
                  className={cn(
                    "h-12 w-12 border-r border-b font-mono text-xl",
                    index === 0 ? "rounded-tl-md" : "rounded-tl-none",
                    index === 8 ? "rounded-tr-md" : "rounded-tr-none",
                    index === 72 ? "rounded-bl-md" : "rounded-bl-none",
                    index === 80 ? "rounded-br-md" : "rounded-br-none",
                    index < 9 ? "border-t" : "border-t-none",
                    index % 9 === 0 ? "border-l" : "border-l-none",
                    index % 27 < 9 ? "border-t-primary" : "border-t-border",
                    index % 27 > 17 ? "border-b-primary" : "border-b-border",
                    index % 3 === 0 ? "border-l-primary" : "border-l-border",
                    index % 3 === 2 ? "border-r-primary" : "border-r-border",
                    getCellBg()
                  )}
                  // biome-ignore lint/suspicious/noArrayIndexKey: sudoku cells have no stable unique ID
                  key={`${cell}-${index}`}
                  onClick={() => onSelect(index)}
                  type="button"
                >
                  {cell > 0 ? cell : ""}
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex gap-2">
            {answer.length > 0 &&
              numberArray.map((number) => (
                <Button
                  key={`input-${number}`}
                  onClick={() => onUpdate(number)}
                  size="icon-sm"
                  type="button"
                >
                  {number}
                </Button>
              ))}
          </div>
        </section>
      )}
      {message && <p>Ooops, encounter an error {message}</p>}
    </div>
  );
}
