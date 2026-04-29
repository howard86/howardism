export type Theme = "terracotta" | "moss" | "ink-blue" | "plum" | "ochre";
export type Mode = "light" | "dark";
export type HomeLayout = "classic" | "statement" | "disc" | "index";

export interface Tweaks {
  homeLayout: HomeLayout;
  mode: Mode;
  theme: Theme;
}

export const TWEAKS_STORAGE_KEY = "howardism:tweaks";

export const DEFAULT_TWEAKS: Tweaks = {
  theme: "terracotta",
  mode: "light",
  homeLayout: "disc",
};
