import type { ReactNode } from "react"

declare module "react" {
  interface ChildrenProps {
    children: ReactNode
  }

  type AsKey = keyof JSX.IntrinsicElements
  type AsHtmlProps<T extends AsKey> = JSX.IntrinsicElements[T]

  interface AsProps<T extends AsKey> extends HTMLProps<T> {
    as?: T
    className?: string
    children: ReactNode
  }

  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined
  }
}
