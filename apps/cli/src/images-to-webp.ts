/**
 * One-shot migration: transcode every committed hero PNG to WebP, repoint the
 * articles' `heroImage` imports at the new file, and drop the PNG.
 *
 * Re-runnable and safe to interrupt. Existing art is transcoded, never
 * regenerated, so no image-generation quota is spent. Any stray PNG left behind
 * by an older import is swept up on the next run.
 *
 *   bun run images:webp            # convert, rewrite, delete the PNGs
 *   DRY_RUN=1 bun run images:webp  # report what would change, touch nothing
 */
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { pngToWebp, rewriteHeroImportToWebp } from "./webp";

const HERE = dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = resolve(HERE, "../../../");
const ASSETS_DIR = resolve(REPO_ROOT, "apps/blog/src/content/assets");
const ARTICLE_DIRS = [
  resolve(REPO_ROOT, "apps/blog/src/content/articles"),
  resolve(REPO_ROOT, "apps/blog/src/content/articles-zh-TW"),
];

const PNG_SUFFIX = /\.png$/;
const MDX_SUFFIX = /\.mdx$/;
/** sharp encodes off the libuv threadpool; more in flight than this just queues. */
const TRANSCODE_CONCURRENCY = 8;

const dryRun = process.env.DRY_RUN === "1";

function mb(bytes: number): string {
  return `${(bytes / 1_048_576).toFixed(1)}MB`;
}

/**
 * Transcode one PNG and drop it. A WebP twin left by an interrupted run is
 * simply overwritten — the encode is deterministic, so re-running costs time
 * rather than correctness.
 */
async function migrateOne(
  filename: string
): Promise<{ pngBytes: number; webpBytes: number }> {
  const pngPath = join(ASSETS_DIR, filename);
  const webpPath = pngPath.replace(PNG_SUFFIX, ".webp");
  const result = await pngToWebp(pngPath, webpPath);
  await rm(pngPath, { force: true });
  return result;
}

async function transcodeAssets(): Promise<void> {
  const entries = await readdir(ASSETS_DIR);
  const pngs = entries.filter((name) => PNG_SUFFIX.test(name)).sort();
  if (pngs.length === 0) {
    console.log("[images:webp] no PNGs left in assets/ — nothing to transcode");
    return;
  }
  if (dryRun) {
    console.log(
      `[images:webp] DRY_RUN — would transcode ${pngs.length} PNG(s) to WebP and delete the originals`
    );
    return;
  }

  let pngTotal = 0;
  let webpTotal = 0;
  for (let i = 0; i < pngs.length; i += TRANSCODE_CONCURRENCY) {
    const batch = pngs.slice(i, i + TRANSCODE_CONCURRENCY);
    const results = await Promise.all(batch.map(migrateOne));
    for (const { pngBytes, webpBytes } of results) {
      pngTotal += pngBytes;
      webpTotal += webpBytes;
    }
    console.log(`[images:webp] ${i + batch.length}/${pngs.length} transcoded`);
  }

  const saved = pngTotal - webpTotal;
  console.log(
    `[images:webp] ${pngs.length} transcoded: ${mb(pngTotal)} → ${mb(webpTotal)} (saved ${mb(saved)}, ${(pngTotal / webpTotal).toFixed(1)}x)`
  );
}

async function rewriteArticles(): Promise<void> {
  let rewritten = 0;
  for (const dir of ARTICLE_DIRS) {
    const entries = await readdir(dir).catch(() => [] as string[]);
    for (const filename of entries.filter((name) => MDX_SUFFIX.test(name))) {
      const path = join(dir, filename);
      const raw = await readFile(path, "utf8");
      const next = rewriteHeroImportToWebp(raw);
      if (next === raw) {
        continue;
      }
      rewritten += 1;
      if (!dryRun) {
        await writeFile(path, next);
      }
    }
  }
  const verb = dryRun ? "DRY_RUN — would rewrite" : "rewrote";
  console.log(`[images:webp] ${verb} ${rewritten} heroImage import line(s)`);
}

async function main(): Promise<void> {
  await transcodeAssets();
  await rewriteArticles();
}

await main();
