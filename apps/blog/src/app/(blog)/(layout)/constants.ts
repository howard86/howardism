export const SectionId = {
  Home: "home",
  About: "about",
  Experience: "experience",
  Resource: "resource",
} as const;
export type SectionId = (typeof SectionId)[keyof typeof SectionId];

export const SECTION_IDS = Object.values(SectionId);

export const SECTION_KEYS = Object.keys(
  SectionId
) as (keyof typeof SectionId)[];

export const NavSection = {
  Home: "/",
  Articles: "/articles",
  Photos: "/photos",
  About: "/about",
} as const;
export type NavSection = (typeof NavSection)[keyof typeof NavSection];

export const NAV_SECTION_KEYS = Object.keys(
  NavSection
) as (keyof typeof NavSection)[];

export const FOOTER_NAV: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Articles", href: "/articles" },
  { label: "Photos", href: "/photos" },
  { label: "About", href: "/about" },
  { label: "Tools", href: "/tools" },
  { label: "RSS", href: "/rss/feed.xml" },
  { label: "Colophon", href: "/about#colophon" },
];
