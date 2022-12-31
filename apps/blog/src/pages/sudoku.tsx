import { Fragment, useMemo } from "react";
import { Menu, Transition } from "@headlessui/react";
import clsx from "clsx";

import { Container } from "@/components/layout/Container";
import { SUDOKU_DIFFICULTIES } from "@/constants/sudoku";
import useSudoku from "@/hooks/useSudoku";

function getBackgroundColor(selected: number, index: number, gameIndex: number) {
  if (selected === index) return "bg-teal-100";

  return gameIndex > 0 ? "bg-zinc-100/80" : "bg-white";
}

export default function SudokuPage() {
  const { loading, selected, onStart, answer, game, message, onSelect, onUpdate } = useSudoku();
  const numberArray = useMemo(() => new Array(9).fill(0).map((_, index) => index + 1), []);

  return (
    <Container>
      <div className="flex flex-col items-center justify-center gap-6 pt-20">
        <Menu as="div" className="relative mt-20 inline-block text-left">
          <Menu.Button className="inline-flex w-full justify-center rounded-md bg-black bg-opacity-20 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
            Start new game
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-full origin-top-right divide-y divide-gray-100 rounded-md bg-white p-1 shadow-lg ring-1  ring-black ring-opacity-5 focus:outline-none">
              {SUDOKU_DIFFICULTIES.map((key) => (
                <Menu.Item
                  key={key}
                  className="group flex w-full items-center rounded-md p-2 text-sm capitalize hover:bg-teal-400"
                  as="button"
                  onClick={() => onStart(key)}
                >
                  {key}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
        {loading ? (
          <span>Loading ...</span>
        ) : (
          <>
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
                    index % 27 < 9 ? "border-t-zinc-600" : "border-t-zinc-100",
                    index % 27 > 17 ? "border-b-zinc-600" : "border-b-zinc-100",
                    index % 3 === 0 ? "border-l-zinc-600" : "border-l-zinc-100",
                    index % 3 === 2 ? "border-r-zinc-600" : "border-r-zinc-100",
                    getBackgroundColor(selected, index, game[index])
                  )}
                  onClick={() => onSelect(index)}
                >
                  {cell > 0 ? cell : ""}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {answer.length > 0 &&
                numberArray.map((number) => (
                  <button
                    type="button"
                    key={`input-${number}`}
                    className="h-10 w-10 rounded-md border font-mono hover:bg-zinc-100 focus:bg-zinc-50"
                    onClick={() => onUpdate(number)}
                  >
                    {number}
                  </button>
                ))}
            </div>
          </>
        )}
        {message && <p>Ooops, encounter an error {message}</p>}
      </div>
    </Container>
  );
}
