import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware navigation primitives bound to `routing`. Prefer these over
 * `next/link` / `next/navigation` for any link that should keep the user in
 * their current locale, or for switching locales explicitly via the `locale`
 * prop on `<Link>` / second arg of `useRouter().replace`. `usePathname()`
 * here returns the pathname **without** the locale prefix, so it composes
 * cleanly with the path-rewriting helpers.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
