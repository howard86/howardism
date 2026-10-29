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

/** Feeds a reader can subscribe to — footer "Subscribe" group. */
export const FEED_LINKS: { label: string; href: string }[] = [
  { label: "RSS", href: "/rss/feed.xml" },
  { label: "JSON feed", href: "/rss/feed.json" },
];

/** Machine-readable maps of the site — footer "For machines" group. */
export const MACHINE_LINKS: { label: string; href: string }[] = [
  { label: "llms.txt", href: "/llms.txt" },
  { label: "sitemap.xml", href: "/sitemap.xml" },
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
