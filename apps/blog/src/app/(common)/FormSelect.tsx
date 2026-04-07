"use client";

import clsx from "clsx";
import get from "lodash.get";
import type { ReactNode } from "react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";
import type { SelectProps } from "react-html-props";

import { getAriaDescribedBy } from "../(blog)/profile/resume/utils";

interface FormSelectProps<T extends FieldValues> extends SelectProps {
  children: ReactNode;
  errors: FieldErrors<T>;
  helperText?: string;
  label?: string;
  name: Path<T>;
  options?: RegisterOptions<T, Path<T>>;
  register: UseFormRegister<T>;
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
  const errorMessage = get(errors, name)?.message;
  const isInvalid = Boolean(errorMessage);

  const text = typeof errorMessage === "string" ? errorMessage : helperText;

  return (
    <div className={clsx("group form-control relative", className)}>
      <label className="sr-only" htmlFor={name}>
        {label}
      </label>
      <select
        aria-describedby={getAriaDescribedBy(name, text, isInvalid)}
        aria-invalid={isInvalid ? "true" : undefined}
        className={clsx(
          "select select-bordered select-sm transition-all",
          isInvalid
            ? "select-error"
            : "active:select-primary group-focus-within:select-primary group-hover:select-primary"
        )}
        id={name}
        {...register(name, options)}
        {...props}
      />
      {text && (
        <p
          className={clsx(
            isInvalid ? "text-error" : "text-base-content",
            "label-text mt-1"
          )}
          id={getAriaDescribedBy(name, text, isInvalid)}
        >
          {text}
        </p>
      )}
    </div>
  );
}
