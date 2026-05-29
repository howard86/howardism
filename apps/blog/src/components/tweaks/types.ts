export type Mode = "light" | "dark";
export type TextSize = "s" | "m" | "l";

export interface Tweaks {
  mode: Mode;
  /** E-reader tap-to-scroll edge zones (touch devices only). */
  tapToScroll: boolean;
  /** Article prose font scale. */
  textSize: TextSize;
}

export const TWEAKS_STORAGE_KEY = "howardism:tweaks";

export const DEFAULT_TWEAKS: Tweaks = {
  mode: "light",
  tapToScroll: false,
  textSize: "m",
};
