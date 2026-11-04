/**
 * Responsive hero variants. The full hero is a 1600px `<slug>.webp`; the CLI
 * writes a downscaled `<slug>-<width>.webp` beside it for each width here, and
 * the blog offers them in the hero's `srcset`. Vercel serves the static export
 * with image optimization off, so these are the only smaller sizes there are.
 *
 * Measured: the hero renders at `100vw - ~48px` on phones and at most 644px on
 * desktop. 800 covers every 2x phone (<=~764 device px) and 1x desktops; 1200
 * every 3x phone (<=~1146). 2x desktops take the 1600px original.
 */
export const HERO_VARIANT_WIDTHS = [800, 1200] as const;

export type HeroVariantWidth = (typeof HERO_VARIANT_WIDTHS)[number];

const WEBP_SUFFIX = /\.webp$/;
const VARIANT_SUFFIX = new RegExp(
  `-(?:${HERO_VARIANT_WIDTHS.join("|")})\\.webp$`
);

/**
 * `foo-800.webp` → `foo.webp`, else null. Only a candidate: callers confirm the
 * base hero exists, so a slug that happens to end in `-800` is not misread.
 */
export function heroVariantBase(filename: string): string | null {
  return VARIANT_SUFFIX.test(filename)
    ? filename.replace(VARIANT_SUFFIX, ".webp")
    : null;
}

/** Whether `filename` is a variant of a hero that is itself in `filenames`. */
export function isHeroVariant(
  filename: string,
  filenames: ReadonlySet<string>
): boolean {
  const base = heroVariantBase(filename);
  return base !== null && filenames.has(base);
}

/** `foo.webp` → `foo-800.webp`; null for a hero that is not WebP. */
export function heroVariantFilename(
  hero: string,
  width: HeroVariantWidth
): string | null {
  return WEBP_SUFFIX.test(hero)
    ? hero.replace(WEBP_SUFFIX, `-${width}.webp`)
    : null;
}
