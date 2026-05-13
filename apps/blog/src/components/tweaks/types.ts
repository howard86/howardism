export type Mode = "light" | "dark";

export interface Tweaks {
  mode: Mode;
}

export const TWEAKS_STORAGE_KEY = "howardism:tweaks";

export const DEFAULT_TWEAKS: Tweaks = {
  mode: "light",
};
