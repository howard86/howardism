"use client";

import { cn } from "@howardism/ui/lib/utils";
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
  children,
  ...props
}: FormSelectProps<T>) {
  const errorMessage = get(errors, name)?.message;
  const isInvalid = Boolean(errorMessage);

  const text = typeof errorMessage === "string" ? errorMessage : helperText;

  return (
    <div className={cn("group relative", className)}>
      {label && (
        <label className="sr-only" htmlFor={name}>
          {label}
        </label>
      )}
      <select
        aria-describedby={getAriaDescribedBy(name, text, isInvalid)}
        aria-invalid={isInvalid ? "true" : undefined}
        className={cn(
          "flex h-8 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isInvalid
            ? "border-destructive focus-visible:ring-destructive"
            : "border-input focus-visible:ring-ring group-focus-within:border-primary group-hover:border-primary"
        )}
        id={name}
        {...register(name, options)}
        {...props}
      >
        {children}
      </select>
      {text && (
        <p
          className={cn(
            "mt-1 text-sm",
            isInvalid ? "text-destructive" : "text-muted-foreground"
          )}
          id={getAriaDescribedBy(name, text, isInvalid)}
        >
          {text}
        </p>
      )}
    </div>
  );
}
