import clsx from "clsx"
import { forwardRef } from "react"
import { InputPropsWithoutRef } from "react-html-props"

export interface InputProps extends InputPropsWithoutRef {
  invalid?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ invalid, className, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx(
      invalid
        ? "border-red-300 placeholder-red-300 focus:border-red-500"
        : "border-zinc-300 focus:border-teal-500",
      "mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-0 sm:text-sm",
      className
    )}
    aria-invalid={invalid ? "true" : undefined}
    {...props}
  />
))

export default Input
