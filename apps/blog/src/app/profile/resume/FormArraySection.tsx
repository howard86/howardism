"use client"

import {
  type Control,
  type FieldArray,
  type FieldArrayPath,
  type FieldValues,
  useFieldArray,
} from "react-hook-form"
import { XCircleIcon } from "@heroicons/react/20/solid"

import FormSectionContainer, { type FormSectionContainerProps } from "./FormSectionContainer"

interface FormArraySectionProps<T extends FieldValues, K extends FieldArrayPath<T>>
  extends Omit<FormSectionContainerProps, "children"> {
  control: Control<T>
  arrayName: K
  arrayValue: FieldArray<T, K>
  // Reference: https://beta.reactjs.org/reference/react/cloneElement#passing-data-with-a-render-prop
  renderFormItems: (index: number) => JSX.Element
}

export default function FormArraySection<T extends FieldValues, K extends FieldArrayPath<T>>({
  control,
  arrayName,
  arrayValue,
  renderFormItems,
  ...props
}: FormArraySectionProps<T, K>) {
  const { append, remove, fields } = useFieldArray({
    control,
    name: arrayName,
    rules: { required: true, minLength: 1 },
  })

  const handleAdd = () => append(arrayValue)

  return (
    <FormSectionContainer {...props}>
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="relative col-span-6 grid grid-cols-6 gap-x-6 gap-y-4 rounded-md border border-zinc-100 p-6 shadow-sm transition-colors focus-within:border-zinc-200 hover:border-zinc-200"
        >
          {fields.length > 1 && (
            <button
              className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2"
              type="button"
              onClick={() => remove(index)}
            >
              <XCircleIcon className="h-6 w-6 fill-zinc-500 transition hover:fill-zinc-600 dark:fill-zinc-400 dark:hover:fill-zinc-300" />
            </button>
          )}
          {renderFormItems(index)}
        </div>
      ))}
      <div className="col-span-6 flex items-center justify-center">
        <button type="button" className="button" onClick={handleAdd}>
          Add More
        </button>
      </div>
    </FormSectionContainer>
  )
}
