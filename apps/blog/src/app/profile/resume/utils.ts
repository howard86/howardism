import type { AriaAttributes } from "react"

export const getAriaDescribedBy = (
  name: string,
  text: string | undefined,
  isInvalid: boolean
): AriaAttributes["aria-describedby"] => {
  if (!name || !text) return undefined

  return isInvalid ? `${name}-error` : `${name}-description`
}
