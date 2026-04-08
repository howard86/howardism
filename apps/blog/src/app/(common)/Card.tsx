import { cn } from "@howardism/ui/lib/utils";
import Link, { type LinkProps } from "next/link";
import type { AsKey, AsProps, ChildrenProps, FC } from "react";
import type { SVGProps } from "react-html-props";

function ChevronRightIcon(props: SVGProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        d="M6.75 5.75 9.25 8l-2.5 2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function Card<T extends AsKey>({
  as,
  className,
  children,
  ...props
}: AsProps<T>) {
  const Component = (as || "div") as unknown as FC<AsProps<T>>;

  return (
    <Component
      className={cn("group relative flex flex-col items-start", className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardLink({ children, ...props }: LinkProps & ChildrenProps) {
  return (
    <>
      <div className="absolute -inset-x-4 -inset-y-6 z-0 scale-95 bg-muted opacity-0 transition group-hover:scale-100 group-hover:opacity-100 sm:-inset-x-6 sm:rounded-2xl" />
      <Link {...props}>
        <span className="absolute -inset-x-4 -inset-y-6 z-20 sm:-inset-x-6 sm:rounded-2xl" />
        <span className="relative z-10">{children}</span>
      </Link>
    </>
  );
}

interface CardTitleProps<T extends AsKey> extends AsProps<T> {
  href?: string;
}

export function CardTitle<T extends AsKey>({
  as,
  href,
  children,
}: CardTitleProps<T>) {
  const Component = (as || "h2") as unknown as FC<AsProps<T>>;

  return (
    <Component className="font-semibold text-base text-foreground tracking-tight">
      {href ? <CardLink href={href}>{children}</CardLink> : children}
    </Component>
  );
}

export function CardDescription({ children }: ChildrenProps) {
  return (
    <p className="relative z-10 mt-2 text-foreground/80 text-sm">{children}</p>
  );
}

export function CardCta({ children }: ChildrenProps) {
  return (
    <div
      aria-hidden="true"
      className="relative z-10 mt-4 flex items-center font-medium text-primary text-sm"
    >
      {children}
      <ChevronRightIcon className="ml-1 h-4 w-4 stroke-current" />
    </div>
  );
}

interface CardEyebrowProps<T extends AsKey> extends AsProps<T> {
  decorate?: boolean;
}

export function CardEyebrow<T extends AsKey = "div">({
  as,
  decorate = false,
  className,
  children,
  ...props
}: CardEyebrowProps<T>) {
  const Component = (as || "div") as unknown as FC<AsProps<T>>;

  return (
    <Component
      className={cn(
        "relative z-10 order-first mb-3 flex items-center text-muted-foreground text-sm",
        decorate && "pl-3.5",
        className
      )}
      {...props}
    >
      {decorate && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 flex items-center"
        >
          <span className="h-4 w-0.5 rounded-full bg-border" />
        </span>
      )}
      {children}
    </Component>
  );
}
