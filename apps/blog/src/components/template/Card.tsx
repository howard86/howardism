import { AsKey, AsProps, ChildrenProps, FC } from "react"
import { SVGProps } from "react-html-props"
import clsx from "clsx"
import Link, { LinkProps } from "next/link"

function ChevronRightIcon(props: SVGProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6.75 5.75 9.25 8l-2.5 2.25"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Card<T extends AsKey>({ as, className, children, ...props }: AsProps<T>) {
  const Component = (as || "div") as unknown as FC<AsProps<T>>

  return (
    <Component className={clsx(className, "group relative flex flex-col items-start")} {...props}>
      {children}
    </Component>
  )
}

export function CardLink({ children, ...props }: LinkProps & ChildrenProps) {
  return (
    <>
      <div className="absolute -inset-y-6 -inset-x-4 z-0 scale-95 bg-zinc-50 opacity-0 transition group-hover:scale-100 group-hover:opacity-100 dark:bg-zinc-800/50 sm:-inset-x-6 sm:rounded-2xl" />
      <Link {...props}>
        <span className="absolute -inset-y-6 -inset-x-4 z-20 sm:-inset-x-6 sm:rounded-2xl" />
        <span className="relative z-10">{children}</span>
      </Link>
    </>
  )
}

interface CardTitleProps<T extends AsKey> extends AsProps<T> {
  href?: string
}

export function CardTitle<T extends AsKey>({ as, href, children }: CardTitleProps<T>) {
  const Component = (as || "h2") as unknown as FC<AsProps<T>>

  return (
    <Component className="text-base font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
      {href ? <CardLink href={href}>{children}</CardLink> : children}
    </Component>
  )
}

export function CardDescription({ children }: ChildrenProps) {
  return <p className="relative z-10 mt-2 text-sm text-zinc-600 dark:text-zinc-400">{children}</p>
}

export function CardCta({ children }: ChildrenProps) {
  return (
    <div
      aria-hidden="true"
      className="relative z-10 mt-4 flex items-center text-sm font-medium text-teal-500"
    >
      {children}
      <ChevronRightIcon className="ml-1 h-4 w-4 stroke-current" />
    </div>
  )
}

interface CardEyebrowProps<T extends AsKey> extends AsProps<T> {
  decorate?: boolean
}

export function CardEyebrow<T extends AsKey = "div">({
  as,
  decorate = false,
  className,
  children,
  ...props
}: CardEyebrowProps<T>) {
  const Component = (as || "div") as unknown as FC<AsProps<T>>

  return (
    <Component
      className={clsx(
        className,
        "relative z-10 order-first mb-3 flex items-center text-sm text-zinc-400 dark:text-zinc-500",
        decorate && "pl-3.5"
      )}
      {...props}
    >
      {decorate && (
        <span className="absolute inset-y-0 left-0 flex items-center" aria-hidden="true">
          <span className="h-4 w-0.5 rounded-full bg-zinc-200 dark:bg-zinc-500" />
        </span>
      )}
      {children}
    </Component>
  )
}
