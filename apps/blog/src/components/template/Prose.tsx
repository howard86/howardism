import { DivProps } from "react-html-props"
import clsx from "clsx"

export function Prose({ children, className }: DivProps) {
  return <div className={clsx(className, "prose dark:prose-invert")}>{children}</div>
}
