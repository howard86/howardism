export interface NavOptions {
  href: string;
  title: string;
}

export const NAV_OPTIONS: NavOptions[] = [{ href: "/", title: "home" }];

export enum SectionId {
  Home = "home",
  About = "about",
  Experience = "experience",
  Resource = "resource",
}

export const SECTION_IDS = Object.values(SectionId);

export const SECTION_KEYS = Object.keys(SectionId) as (keyof typeof SectionId)[];
