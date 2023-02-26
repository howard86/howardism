import type { AriaAttributes } from "react"

export const getAriaDescribedBy = (
  name: string,
  text: string | undefined,
  isInvalid: boolean
): AriaAttributes["aria-describedby"] => {
  if (!name || !text) return undefined

  return isInvalid ? `${name}-error` : `${name}-description`
}

export const generateStringArray = (items?: string) => (items ? items.split("\n") : [])

export const convertDateString = (dateString: string) => {
  const date = new Date(dateString)

  return `${date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`
}
