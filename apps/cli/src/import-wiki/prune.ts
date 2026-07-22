/**
 * Deletes generated articles whose vault source has disappeared (note deleted
 * or renamed in the Obsidian vault).
 *
 * Safety rests on one guarantee: every `.mdx` slug on disk under
 * `blogArticlesPath` traces back to a slug the importer discovered in the
 * vault (`concepts/*.md` + `derived/*.md`, via {@link discoverWikiSources}).
 * There is no other source of hand-authored articles in that directory — the
 * on-disk slug set has been verified to exactly equal the vault slug set plus
 * a handful of known-orphaned MOCs (see the caller in `index.ts`). So an
 * on-disk slug with no matching vault note is safe to prune.
 */
import { readdir, rm } from "node:fs/promises";
import { extname, join } from "node:path";

import type { ParsedWikiFile } from "./parse.ts";

const MDX_EXT = ".mdx";

/**
 * The full-corpus vault slug set, used as the "not orphaned" set. Must be
 * built from the pre-`--only`-filter parse (every note the vault currently
 * has), including `archived: true` notes — they're skipped during emission
 * but still exist in the vault, so pruning must not treat them as deleted.
 *
 * Known ceiling: archiving an ALREADY-emitted note therefore leaves its
 * stale article on the blog, which undercuts what `archived: true` is for.
 * Deliberate — deleting on an authoring flag is a sharper edge than deleting
 * on "the note is gone", and the vault has no archived notes today. Fold
 * archived slugs into the orphan set if that stops being true.
 */
export function deriveVaultSlugSet(
  parsedAll: Pick<ParsedWikiFile, "source">[]
): Set<string> {
  return new Set(parsedAll.map((p) => p.source.slug));
}

export async function listArticleSlugs(articlesDir: string): Promise<string[]> {
  const entries = await readdir(articlesDir).catch(() => []);
  return entries
    .filter((entry) => extname(entry) === MDX_EXT)
    .map((entry) => entry.slice(0, -MDX_EXT.length));
}

/**
 * `--only <slug>` parses a single note, so every other on-disk article would
 * look orphaned — callers must pass the active `onlySlug` and get back an
 * empty list in that mode rather than relying on discipline elsewhere.
 */
export function computeOrphanedSlugs(args: {
  onDiskSlugs: string[];
  onlySlug: string | null;
  vaultSlugs: ReadonlySet<string>;
}): string[] {
  if (args.onlySlug) {
    return [];
  }
  return args.onDiskSlugs.filter((slug) => !args.vaultSlugs.has(slug)).sort();
}

export interface PruneOrphanedArticlesArgs {
  articlesDir: string;
  assetsDir: string;
  dryRun: boolean;
  onlySlug: string | null;
  vaultSlugs: ReadonlySet<string>;
  zhArticlesDir: string;
}

/**
 * Deletes each orphaned article's MDX, hero PNG, and zh-TW translation (any
 * of which may not exist — `rm` with `force` no-ops rather than throwing).
 * `DRY_RUN=1` logs what would be deleted without touching disk.
 */
export async function pruneOrphanedArticles(
  args: PruneOrphanedArticlesArgs
): Promise<string[]> {
  const {
    articlesDir,
    assetsDir,
    zhArticlesDir,
    vaultSlugs,
    onlySlug,
    dryRun,
  } = args;
  const onDiskSlugs = await listArticleSlugs(articlesDir);
  const orphans = computeOrphanedSlugs({ onDiskSlugs, onlySlug, vaultSlugs });

  for (const slug of orphans) {
    if (dryRun) {
      console.log(
        `[prune] DRY_RUN — would delete orphaned article: ${slug} (no matching vault note)`
      );
      continue;
    }
    console.log(
      `[prune] deleting orphaned article: ${slug} (no matching vault note)`
    );
    await Promise.all([
      rm(join(articlesDir, `${slug}${MDX_EXT}`), { force: true }),
      rm(join(assetsDir, `${slug}.png`), { force: true }),
      rm(join(zhArticlesDir, `${slug}${MDX_EXT}`), { force: true }),
    ]);
  }

  return orphans;
}
