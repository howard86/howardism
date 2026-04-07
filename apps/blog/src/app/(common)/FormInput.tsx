"use client";

import clsx from "clsx";
import get from "lodash.get";
import type {
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";
import type { InputProps } from "react-html-props";

import { getAriaDescribedBy } from "../(blog)/profile/resume/utils";

interface FormInputProps<T extends FieldValues> extends InputProps {
  errors: FieldErrors<T>;
  helperText?: string;
  label: string;
  name: Path<T>;
  options?: RegisterOptions<T, Path<T>>;
  register: UseFormRegister<T>;
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
  const errorMessage = get(errors, name)?.message;
  const isInvalid = Boolean(errorMessage);

  const text = typeof errorMessage === "string" ? errorMessage : helperText;

  return (
    <div className={clsx("group form-control relative", className)}>
      <label className="label absolute -top-4.5 left-2.5" htmlFor={name}>
        <span
          className={clsx(
            "label-text bg-base-100 px-0.5 font-medium transition-colors",
            isInvalid
              ? "text-error"
              : "group-focus-within:text-primary group-hover:text-primary"
          )}
        >
          {label}
        </span>
      </label>
      <input
        aria-describedby={getAriaDescribedBy(name, text, isInvalid)}
        aria-invalid={isInvalid ? "true" : undefined}
        className={clsx(
          "input input-bordered transition-all",
          isInvalid
            ? "input-error"
            : "active:input-primary group-focus-within:input-primary group-hover:input-primary"
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
