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

// TODO: handle error state
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
    <div className={clsx(className, "form-control")}>
      <label className="label" htmlFor={name}>
        <span className="label-text">{label}</span>
      </label>
      <TextareaAutosize
        aria-describedby={getAriaDescribedBy(name, text, isInvalid)}
        className={clsx(
          "textarea textarea-bordered",
          isInvalid
            ? "textarea-error"
            : "focus-within:input-primary hover:input-primary active:input-primary"
        )}
        id={name}
        minRows={2}
        {...register(name, options)}
        {...props}
      />
      {text && (
        <p
          className={clsx(
            isInvalid ? "text-error" : "text-neutral",
            "mt-2 text-sm"
          )}
          id={getAriaDescribedBy(name, text, isInvalid)}
        >
          {text}
        </p>
      )}
    </div>
  );
}
