/**
 * Primary site nav. Keys match `messages.Nav.*` so labels are looked up via
 * `useTranslations("Nav")` rather than reading the const itself.
 */
export const NavSection = {
  home: "/",
  articles: "/articles",
} as const;
export type NavSectionKey = keyof typeof NavSection;

export const NAV_SECTION_KEYS = Object.keys(NavSection) as NavSectionKey[];

/**
 * Footer nav rows. Keys are looked up against the `namespace` message bundle:
 * Home/Articles share the `Nav` namespace with the header; RSS is a
 * footer-only label so it lives under `Footer.rss`. The discriminated union
 * keeps each `key` typed against its namespace so `t(key)` is type-safe.
 */
export type FooterNavItem = {
  href: string;
} & (
  | { key: NavSectionKey; namespace: "Nav" }
  | { key: "rss"; namespace: "Footer" }
);

export const FOOTER_NAV: FooterNavItem[] = [
  { key: "home", href: "/", namespace: "Nav" },
  { key: "articles", href: "/articles", namespace: "Nav" },
  { key: "rss", href: "/rss/feed.xml", namespace: "Footer" },
];
