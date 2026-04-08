import NextLink, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";

export interface RouteLinkProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  href: string;
}

export default function RouteLink({
  href,
  children,
  className,
  ...props
}: RouteLinkProps): JSX.Element {
  return (
    <NextLink className={className} href={href} {...props}>
      {children}
    </NextLink>
  );
}
