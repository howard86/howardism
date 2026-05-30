import { cn } from "@howardism/ui/lib/utils";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link, { type LinkProps } from "next/link";
import type { AsKey, AsProps, ChildrenProps, FC } from "react";

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
      <HugeiconsIcon className="ml-1 size-4" icon={ArrowRight01Icon} />
    </div>
  );
}
