import clsx from "clsx"
import { DivProps } from "react-html-props"

export function Prose({ children, className }: DivProps) {
  return <div className={clsx(className, "prose dark:prose-invert")}>{children}</div>
}
