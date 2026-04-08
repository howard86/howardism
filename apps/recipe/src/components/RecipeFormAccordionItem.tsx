import type React from "react";

import { useFormContext } from "react-hook-form";

import type { RecipeFormValues } from "./RecipeForm";

interface RecipeFormAccordionItemProps<T extends Record<string, unknown>> {
  fieldIndex: number;
  fieldName: string;
  formName: string;
  newField: T;
}

const mapKey = (key: string) => {
  switch (key) {
    case "name":
      return "名稱";
    case "amount":
      return "數量";
    case "unit":
      return "單位";
    case "processing":
      return "配料工序（選填）";
    case "summary":
      return "步驟簡稱";
    case "description":
      return "詳細說明";
    default:
      return key;
  }
};

export default function RecipeFormAccordionItem<
  T extends Record<string, unknown>,
>({
  newField,
  formName,
  fieldName,
  fieldIndex,
}: RecipeFormAccordionItemProps<T>): React.JSX.Element {
  const { register } = useFormContext<RecipeFormValues>();

  return (
    <details className="w-full rounded-lg border">
      <summary className="flex cursor-pointer items-center px-4 py-2 text-left font-medium hover:bg-black/5">
        {fieldName}
      </summary>
      <div className="px-4 pt-2 pb-4">
        <div className="space-y-4">
          {Object.keys(newField).map((key) => {
            const id = `${formName}.${fieldIndex}.${key}`;
            return (
              <div className="grid gap-2" key={key}>
                <label className="font-medium text-sm" htmlFor={id}>
                  {mapKey(key)}
                </label>
                <input
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 md:text-sm"
                  id={id}
                  placeholder={`${formName} ${key}`}
                  step={key === "amount" ? 0.1 : undefined}
                  type={key === "amount" ? "number" : "text"}
                  {...register(id as Parameters<typeof register>[0])}
                />
              </div>
            );
          })}
        </div>
      </div>
    </details>
  );
}
