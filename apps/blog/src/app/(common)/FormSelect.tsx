"use client"

import clsx from "clsx"
import get from "lodash.get"
import { ReactNode } from "react"
import type {
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form"
import { SelectProps } from "react-html-props"

import { getAriaDescribedBy } from "../(blog)/profile/resume/utils"

interface FormSelectProps<T extends FieldValues> extends SelectProps {
  label?: string
  name: Path<T>
  register: UseFormRegister<T>
  options?: RegisterOptions<T, Path<T>>
  errors: FieldErrors<T>
  helperText?: string
  children: ReactNode
}

export default function FormSelect<T extends FieldValues>({
  label,
  name,
  register,
  options,
  errors,
  className,
  helperText,
  ...props
}: FormSelectProps<T>) {
  const errorMessage = get(errors, name)?.message
  const isInvalid = Boolean(errorMessage)

  const text = typeof errorMessage === "string" ? errorMessage : helperText

  return (
    <div className={clsx("group form-control relative", className)}>
      <label htmlFor={name} className="sr-only">
        {label}
      </label>
      <select
        id={name}
        aria-describedby={getAriaDescribedBy(name, text, isInvalid)}
        aria-invalid={isInvalid ? "true" : undefined}
        className={clsx(
          "select-bordered select select-sm transition-all",
          isInvalid
            ? "select-error"
            : "active:select-primary group-focus-within:select-primary group-hover:select-primary"
        )}
        {...register(name, options)}
        {...props}
      />
      {text && (
        <p
          id={getAriaDescribedBy(name, text, isInvalid)}
          className={clsx(isInvalid ? "text-error" : "text-base-content", "label-text mt-1")}
        >
          {text}
        </p>
      )}
    </div>
  )
}
