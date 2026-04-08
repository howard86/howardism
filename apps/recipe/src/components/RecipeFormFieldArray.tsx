import { nanoid } from "@reduxjs/toolkit";
import { Minus, Plus } from "lucide-react";
import type React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import type { RecipeFormValues } from "./RecipeForm";
import RecipeFormAccordionItem from "./RecipeFormAccordionItem";

type ArrayFieldName = "ingredients" | "seasonings" | "steps";

interface RecipeFormFieldArrayProps<T extends Record<string, unknown>> {
  arrayFieldDisplayKey: keyof T & string;
  arrayFieldName: ArrayFieldName;
  newArrayField: T;
  title: string;
}

export default function RecipeFormFieldArray<
  T extends Record<string, unknown>,
>({
  title,
  newArrayField,
  arrayFieldName,
  arrayFieldDisplayKey,
}: RecipeFormFieldArrayProps<T>): React.JSX.Element {
  const { control } = useFormContext<RecipeFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: arrayFieldName,
  });

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{title}</h3>
        <button
          aria-label={`add ${arrayFieldName}`}
          className="rounded-lg p-1 transition-colors hover:bg-black/5"
          onClick={() =>
            append(
              newArrayField as unknown as RecipeFormValues[ArrayFieldName][number]
            )
          }
          type="button"
        >
          <Plus className="size-8" />
        </button>
      </div>
      <div className="space-y-1">
        {fields.map((field, index) => {
          const fieldKey = nanoid();
          const displayValue = String(
            (field as Record<string, unknown>)[arrayFieldDisplayKey] ?? ""
          );

          return (
            <div className="flex" key={field.id}>
              <RecipeFormAccordionItem
                fieldIndex={index}
                fieldName={`#${index + 1} ${displayValue}`}
                formName={arrayFieldName}
                newField={newArrayField}
              />
              <button
                aria-label={`remove ${fieldKey} ${arrayFieldName}`}
                className="self-start rounded-lg p-1 transition-colors hover:bg-black/5"
                onClick={() => remove(index)}
                type="button"
              >
                <Minus className="size-8" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
