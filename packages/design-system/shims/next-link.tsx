// Stand-in for next/link outside Next.js: a plain anchor with the same props.
import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children?: ReactNode;
  href: string | { pathname?: string };
  prefetch?: boolean | null;
  replace?: boolean;
  scroll?: boolean;
};

export default function Link({
  href,
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  ...rest
}: LinkProps) {
  const url = typeof href === "string" ? href : (href.pathname ?? "#");
  return <a href={url} {...rest} />;
}
