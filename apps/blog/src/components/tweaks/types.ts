export type Mode = "light" | "dark";
export type TextSize = "s" | "m" | "l";

export interface Tweaks {
  /** Spike: focus mode collapses chrome to running head only. */
  focusMode: boolean;
  mode: Mode;
  /** E-reader tap-to-scroll edge zones (touch devices only). */
  tapToScroll: boolean;
  /** Article prose font scale. */
  textSize: TextSize;
}

export const TWEAKS_STORAGE_KEY = "howardism:tweaks";

export const DEFAULT_TWEAKS: Tweaks = {
  focusMode: false,
  mode: "light",
  tapToScroll: false,
  textSize: "m",
};
