"use client"

import clsx from "clsx"
import get from "lodash.get"
import type {
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form"
import { InputProps } from "react-html-props"

import { getAriaDescribedBy } from "./utils"

interface FormInputProps<T extends FieldValues> extends InputProps {
  label: string
  name: Path<T>
  register: UseFormRegister<T>
  options?: RegisterOptions<T, Path<T>>
  errors: FieldErrors<T>
  helperText?: string
}

// TODO: handle error state
export default function FormInput<T extends FieldValues>({
  label,
  name,
  register,
  options,
  errors,
  className,
  helperText,
  ...props
}: FormInputProps<T>) {
  const errorMessage = get(errors, name)?.message
  const isInvalid = Boolean(errorMessage)

  const text = typeof errorMessage === "string" ? errorMessage : helperText

  return (
    <div className={clsx("form-control", className)}>
      <label htmlFor={name} className="label">
        <span className="label-text">{label}</span>
      </label>
      <input
        id={name}
        aria-describedby={getAriaDescribedBy(name, text, isInvalid)}
        aria-invalid={isInvalid ? "true" : undefined}
        className={clsx("input-bordered input", isInvalid && "input-error")}
        {...register(name, options)}
        {...props}
      />
      {text && (
        <p
          id={getAriaDescribedBy(name, text, isInvalid)}
          className={clsx(isInvalid ? "text-error" : "text-neutral", "mt-2 text-sm")}
        >
          {text}
        </p>
      )}
    </div>
  )
}
