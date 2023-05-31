import clsx from "clsx"
import { LabelProps } from "react-html-props"

export default function Label({ className, ...props }: LabelProps) {
  // eslint-disable-next-line jsx-a11y/label-has-associated-control
  return <label className={clsx("block text-sm font-medium text-zinc-700", className)} {...props} />
}
