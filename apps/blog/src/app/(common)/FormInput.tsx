"use client";

import { Input } from "@howardism/ui/components/input";
import { cn } from "@howardism/ui/lib/utils";
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
    <div className={cn("group relative", className)}>
      <label className="absolute -top-4.5 left-2.5" htmlFor={name}>
        <span
          className={cn(
            "bg-background px-0.5 font-medium text-sm transition-colors",
            isInvalid
              ? "text-destructive"
              : "group-focus-within:text-primary group-hover:text-primary"
          )}
        >
          {label}
        </span>
      </label>
      <Input
        aria-describedby={getAriaDescribedBy(name, text, isInvalid)}
        aria-invalid={isInvalid ? "true" : undefined}
        className={cn(
          isInvalid && "border-destructive focus-visible:ring-destructive"
        )}
        id={name}
        {...register(name, options)}
        {...props}
      />
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
