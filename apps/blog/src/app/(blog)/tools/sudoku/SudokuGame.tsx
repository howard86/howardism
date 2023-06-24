"use client"

import clsx from "clsx"

import { SUDOKU_DIFFICULTIES } from "./constants"
import useSudoku from "./useSudoku"

const numberArray = new Array(9).fill(0).map((_, index) => index + 1)

export default function SudokuGame() {
  const { loading, selected, onStart, answer, game, message, onSelect, onUpdate } = useSudoku()

  return (
    <div className="flex flex-col items-center justify-center">
      <details className="dropdown">
        <summary className={clsx("btn-brand btn", loading && "btn-disabled")}>
          Start new game
        </summary>
        <ul className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow">
          {SUDOKU_DIFFICULTIES.map((key) => (
            <li key={key}>
              <button type="button" onClick={() => onStart(key)} className="capitalize">
                {key}
              </button>
            </li>
          ))}
        </ul>
      </details>
      {!loading && (
        <section className="mt-12 flex flex-col items-center">
          <div className="grid-rows-9 grid grid-cols-9">
            {answer.map((cell, index) => (
              <button
                // eslint-disable-next-line react/no-array-index-key
                key={`${cell}-${index}`}
                type="button"
                className={clsx(
                  "h-12 w-12 border-b border-r font-mono text-xl",
                  index === 0 ? "rounded-tl-md" : "rounded-tl-none",
                  index === 8 ? "rounded-tr-md" : "rounded-tr-none",
                  index === 72 ? "rounded-bl-md" : "rounded-bl-none",
                  index === 80 ? "rounded-br-md" : "rounded-br-none",
                  index < 9 ? "border-t" : "border-t-none",
                  index % 9 === 0 ? "border-l" : "border-l-none",
                  index % 27 < 9 ? "border-t-primary" : "border-t-base-300",
                  index % 27 > 17 ? "border-b-primary" : "border-b-base-300",
                  index % 3 === 0 ? "border-l-primary" : "border-l-base-300",
                  index % 3 === 2 ? "border-r-primary" : "border-r-base-300",
                  // eslint-disable-next-line no-nested-ternary
                  selected === index
                    ? "bg-base-300"
                    : game[index] > 0
                    ? "bg-base-200"
                    : "bg-base-100"
                )}
                onClick={() => onSelect(index)}
              >
                {cell > 0 ? cell : ""}
              </button>
            ))}
          </div>
          <div className="mt-8 flex gap-2">
            {answer.length > 0 &&
              numberArray.map((number) => (
                <button
                  type="button"
                  key={`input-${number}`}
                  className="btn-brand btn-sm btn-square btn"
                  onClick={() => onUpdate(number)}
                >
                  {number}
                </button>
              ))}
          </div>
        </section>
      )}
      {message && <p>Ooops, encounter an error {message}</p>}
    </div>
  )
}
