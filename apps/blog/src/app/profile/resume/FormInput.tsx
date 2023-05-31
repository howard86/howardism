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

import Input, { InputProps } from "@/components/form/Input"
import Label from "@/components/form/Label"

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
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        invalid={isInvalid}
        aria-describedby={getAriaDescribedBy(name, text, isInvalid)}
        {...register(name, options)}
        {...props}
      />
      {text && (
        <p
          className={clsx(isInvalid ? "text-red-500" : " text-zinc-500", "mt-2 text-sm")}
          id={getAriaDescribedBy(name, text, isInvalid)}
        >
          {text}
        </p>
      )}
    </div>
  )
}
