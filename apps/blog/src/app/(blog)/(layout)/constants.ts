export const NavSection = {
  Home: "/",
  Articles: "/articles",
  Questions: "/questions",
} as const;
export type NavSection = (typeof NavSection)[keyof typeof NavSection];

export const NAV_SECTION_KEYS = Object.keys(
  NavSection
) as (keyof typeof NavSection)[];

export const FOOTER_NAV: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Articles", href: "/articles" },
  { label: "Questions", href: "/questions" },
  { label: "RSS", href: "/rss/feed.xml" },
];
