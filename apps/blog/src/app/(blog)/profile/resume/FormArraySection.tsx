"use client";

import { XCircleIcon } from "@heroicons/react/20/solid";
import { ArrowDownCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@howardism/ui/components/button";
import {
  type Control,
  type FieldArray,
  type FieldArrayPath,
  type FieldValues,
  useFieldArray,
} from "react-hook-form";

import FormSectionContainer, {
  type FormSectionContainerProps,
} from "./FormSectionContainer";

interface FormArraySectionProps<
  T extends FieldValues,
  K extends FieldArrayPath<T>,
> extends Omit<FormSectionContainerProps, "children"> {
  arrayName: K;
  arrayValue: FieldArray<T, K>;
  control: Control<T>;
  // Reference: https://beta.reactjs.org/reference/react/cloneElement#passing-data-with-a-render-prop
  renderFormItems: (index: number) => JSX.Element;
}

export default function FormArraySection<
  T extends FieldValues,
  K extends FieldArrayPath<T>,
>({
  control,
  arrayName,
  arrayValue,
  renderFormItems,
  ...props
}: FormArraySectionProps<T, K>) {
  const { append, remove, fields, swap } = useFieldArray({
    control,
    name: arrayName,
    rules: { required: true, minLength: 1 },
  });

  const handleAdd = () => append(arrayValue);

  return (
    <FormSectionContainer {...props}>
      {fields.map((field, index) => (
        <div
          className="group relative col-span-6 grid grid-cols-6 gap-x-6 gap-y-4 rounded-md border border-border p-6 shadow-sm transition"
          key={field.id}
        >
          {fields.length > 1 && (
            <Button
              aria-label="Remove item"
              className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-all group-hover:opacity-100 group-active:opacity-100"
              onClick={() => remove(index)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <XCircleIcon className="w-6 fill-current transition-colors" />
            </Button>
          )}
          {index > 0 && (
            <Button
              aria-label="Move up"
              className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-all group-hover:opacity-100 group-active:opacity-100"
              onClick={() => swap(index, index - 1)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <ArrowDownCircleIcon className="w-6 rotate-180 fill-background transition-colors" />
            </Button>
          )}
          {index !== fields.length - 1 && (
            <Button
              aria-label="Move down"
              className="absolute right-1/2 bottom-0 translate-x-1/2 translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100"
              onClick={() => swap(index, index + 1)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <ArrowDownCircleIcon className="w-6 fill-background transition-colors" />
            </Button>
          )}
          {renderFormItems(index)}
        </div>
      ))}
      <div className="col-span-6 flex items-center justify-center">
        <Button onClick={handleAdd} type="button">
          Add More
        </Button>
      </div>
    </FormSectionContainer>
  );
}
