export const NavSection = {
  Home: "/",
  Articles: "/articles",
  Questions: "/questions",
  Shelf: "/shelf",
} as const;
export type NavSection = (typeof NavSection)[keyof typeof NavSection];

export const NAV_SECTION_KEYS = Object.keys(
  NavSection
) as (keyof typeof NavSection)[];

export const FOOTER_NAV: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Articles", href: "/articles" },
  { label: "Questions", href: "/questions" },
  { label: "Shelf", href: "/shelf" },
  { label: "RSS", href: "/rss/feed.xml" },
];

/** Machine-readable maps of the site — footer only, not part of the nav. */
export const REFERENCE_LINKS: { label: string; href: string }[] = [
  { label: "llms.txt", href: "/llms.txt" },
  { label: "sitemap.xml", href: "/sitemap.xml" },
  { label: "feed.json", href: "/rss/feed.json" },
];

const FILE_EXTENSION = /\.[a-z]+$/;

/**
 * A file route (`/llms.txt`, `/rss/feed.xml`) rather than a page. Link it with
 * a plain `<a>`: `next/link` prefetches it as an RSC payload the route cannot
 * serve, so every rendered page invoked its function.
 */
export function isFileHref(href: string): boolean {
  return FILE_EXTENSION.test(href);
}
