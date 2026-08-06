/**
 * Plate taxonomy — the blog's information architecture, numbered once as data.
 *
 * Every public page identifies itself by a plate key; the `PlatePage` shell
 * reads `number` + `label` from here so the eyebrow numbering stays systematic
 * and unique: Masthead (00), then Plates I–IV in IA order. Domain pages and the
 * article reader are both leaves of Plate II, so they share the `domains` key
 * and append the specific domain to the eyebrow (`Plate II · {domain}`).
 *
 * `number` is arabic to match the live `{label} · No. {number}` eyebrow format;
 * `title` is a default the page may override with its own editorial headline.
 */
export const PLATE_META = {
  home: { number: "00", label: "Masthead", title: "The desk" },
  articles: { number: "01", label: "Plate I", title: "Writing, in order" },
  domains: { number: "02", label: "Plate II", title: "Domains" },
  questions: { number: "03", label: "Plate III", title: "Open questions" },
  shelf: { number: "04", label: "Plate IV", title: "The shelf" },
  learn: { number: "05", label: "Plate V", title: "The drill" },
  review: { number: "06", label: "Plate VI", title: "Spaced review" },
} as const;

export type PlateKey = keyof typeof PLATE_META;
