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
  App: "/profile",
  Tools: "/tools",
} as const;
export type NavSection = (typeof NavSection)[keyof typeof NavSection];

export const NAV_SECTION_KEYS = Object.keys(
  NavSection
) as (keyof typeof NavSection)[];
