/**
 * Hero-image encoding. The `$imagegen` skill (via codex/agy) only emits PNG, and
 * a 1600x900 lossless PNG of flat-shaded art runs 1-8MB — so every hero is
 * transcoded to WebP before it is committed. Both the importer and the one-shot
 * `images:webp` migration go through here so they cannot drift apart.
 */
import { stat } from "node:fs/promises";

import sharp from "sharp";

/**
 * Measured on the existing corpus: q82 lands ~12x under the source PNG while
 * holding the illustrations' hard edges. Lossless WebP only manages ~1.5x, and
 * q88 costs ~40% more bytes for no visible gain on flat shading.
 */
const WEBP_QUALITY = 82;
/** Densest libwebp search — each hero is encoded once and then committed. */
const WEBP_EFFORT = 6;

// The `export { default as heroImage } from "../assets/<slug>.png";` line every
// emitted MDX carries. Captures everything up to the extension, plus the closing
// quote, so only the extension is swapped.
const HERO_PNG_IMPORT_RE =
  /(export\s*\{\s*default as heroImage\s*\}\s*from\s*["']\.\.\/assets\/[^"']+)\.png(["'])/;

export interface TranscodeResult {
  pngBytes: number;
  webpBytes: number;
}

/** Transcode a hero PNG to WebP, returning both byte counts for reporting. */
export async function pngToWebp(
  pngPath: string,
  webpPath: string
): Promise<TranscodeResult> {
  const { size: pngBytes } = await stat(pngPath);
  const { size: webpBytes } = await sharp(pngPath)
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
    .toFile(webpPath);
  return { pngBytes, webpBytes };
}

/**
 * Point an MDX article's hero import at the WebP twin. Returns the source
 * unchanged when the line is already `.webp` (or absent), so the migration and
 * the importer are both safe to re-run.
 */
export function rewriteHeroImportToWebp(raw: string): string {
  return raw.replace(HERO_PNG_IMPORT_RE, "$1.webp$2");
}
