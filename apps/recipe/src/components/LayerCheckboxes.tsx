import { type ChangeEvent, useState } from "react";

import type { Ingredient } from "@/types/recipe";

interface LayerCheckboxesProps {
  options: Ingredient[];
  title: string;
}

export default function LayerCheckboxes({
  title,
  options,
}: LayerCheckboxesProps) {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    new Array(options.length).fill(false)
  );

  const isAllChecked = checkedItems.every(Boolean);
  const isIndeterminate = checkedItems.some(Boolean) && !isAllChecked;

  const handleOnParentChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCheckedItems(new Array(options.length).fill(e.target.checked));
  };

  return (
    <div className="p-4">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          checked={isAllChecked}
          className="h-4 w-4 rounded border-muted accent-primary"
          onChange={handleOnParentChange}
          ref={(el) => {
            if (el) {
              el.indeterminate = isIndeterminate;
            }
          }}
          type="checkbox"
        />
        <span className="font-medium text-lg sm:text-xl">{title}</span>
      </label>
      <div className="mt-2 space-y-1 pl-3">
        {options.map((option, index) => (
          <label
            className="flex cursor-pointer items-center gap-2"
            key={option.id}
          >
            <input
              checked={checkedItems[index]}
              className="h-4 w-4 rounded border-muted accent-primary"
              onChange={(e) => {
                setCheckedItems((items) => {
                  const newItems = [...items];
                  newItems[index] = e.target.checked;
                  return newItems;
                });
              }}
              type="checkbox"
            />
            <span>
              {option.amount > 0
                ? `${option.name} ${option.amount} ${option.unit}`
                : `${option.name} ${option.unit}`}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
