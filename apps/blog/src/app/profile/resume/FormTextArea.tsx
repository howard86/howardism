"use client"

import type { FieldValues, Path, RegisterOptions, UseFormRegister } from "react-hook-form"
import TextareaAutosize, { TextareaAutosizeProps } from "react-textarea-autosize"

interface FormTextAreaProps<T extends FieldValues> extends TextareaAutosizeProps {
  label: string
  name: Path<T>
  register: UseFormRegister<T>
  options?: RegisterOptions<T, Path<T>>
  helperText?: string
}

// TODO: handle error state
export default function FormTextArea<T extends FieldValues>({
  id,
  label,
  name,
  register,
  options,
  className,
  helperText,
  ...props
}: FormTextAreaProps<T>) {
  return (
    <div className={className}>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <TextareaAutosize
        id={id}
        className="mt-1 block w-full rounded-md border border-zinc-300 py-2 px-3 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-0 sm:text-sm"
        aria-describedby={helperText ? `${id}-description` : undefined}
        minRows={2}
        {...register(name, options)}
        {...props}
      />
      {helperText && (
        <p className="mt-2 text-sm text-zinc-500" id={`${id}-description`}>
          {helperText}
        </p>
      )}
    </div>
  )
}
