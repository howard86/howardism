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

import { getAriaDescribedBy } from "../(blog)/profile/resume/utils"

interface FormInputProps<T extends FieldValues> extends InputProps {
  label: string
  name: Path<T>
  register: UseFormRegister<T>
  options?: RegisterOptions<T, Path<T>>
  errors: FieldErrors<T>
  helperText?: string
}

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
    <div className={clsx("group form-control relative", className)}>
      <label htmlFor={name} className="label absolute -top-4.5 left-2.5">
        <span
          className={clsx(
            "label-text bg-base-100 px-0.5 font-medium transition-colors",
            isInvalid ? "text-error" : "group-focus-within:text-primary group-hover:text-primary",
          )}
        >
          {label}
        </span>
      </label>
      <input
        id={name}
        aria-describedby={getAriaDescribedBy(name, text, isInvalid)}
        aria-invalid={isInvalid ? "true" : undefined}
        className={clsx(
          "input input-bordered transition-all",
          isInvalid
            ? "input-error"
            : "active:input-primary group-focus-within:input-primary group-hover:input-primary",
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
