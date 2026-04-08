"use client";

import { cn } from "@howardism/ui/lib/utils";
import get from "lodash.get";
import type {
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";
import TextareaAutosize, {
  type TextareaAutosizeProps,
} from "react-textarea-autosize";

import { getAriaDescribedBy } from "./utils";

interface FormTextAreaProps<T extends FieldValues>
  extends TextareaAutosizeProps {
  errors: FieldErrors<T>;
  helperText?: string;
  label: string;
  name: Path<T>;
  options?: RegisterOptions<T, Path<T>>;
  register: UseFormRegister<T>;
}

export default function FormTextArea<T extends FieldValues>({
  label,
  name,
  register,
  errors,
  options,
  className,
  helperText,
  ...props
}: FormTextAreaProps<T>) {
  const errorMessage = get(errors, name)?.message;
  const isInvalid = Boolean(errorMessage);

  const text = typeof errorMessage === "string" ? errorMessage : helperText;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        htmlFor={name}
      >
        {label}
      </label>
      <TextareaAutosize
        aria-describedby={getAriaDescribedBy(name, text, isInvalid)}
        aria-invalid={isInvalid ? "true" : undefined}
        className={cn(
          "flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isInvalid
            ? "border-destructive focus-visible:ring-destructive"
            : "border-input focus-visible:ring-ring"
        )}
        id={name}
        minRows={2}
        {...register(name, options)}
        {...props}
      />
      {text && (
        <p
          className={cn(
            "text-sm",
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
