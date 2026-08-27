/**
 * `_system/catalog.tsv` is the vault's machine-readable index of every wiki
 * page except the 14 `moc-*` pages and the 2 `generated: true` pages (those
 * 16 resolve their domain without a catalog row — see `domains.ts`'s
 * `buildDomainMembership`). It replaces MOC-body wikilink scraping as the
 * domain + description source of truth: one header row, then one
 * tab-separated row per page (`path type domain title summary updated
 * bytes`).
 */
import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";

import { isMocSlug } from "./domains.ts";
import type { ParsedWikiFile } from "./parse.ts";

export interface CatalogRow {
  domain: string;
  summary: string;
  title: string;
  type: string;
}

/** `path\ttype\tdomain\ttitle\tsummary\t...` — only the first 5 columns matter here. */
const MIN_CATALOG_COLUMNS = 5;

/** Parse the catalog TSV into a slug → row map, keyed by `basename(path, ".md")`. */
export async function loadCatalog(
  catalogPath: string
): Promise<Map<string, CatalogRow>> {
  const raw = await readFile(catalogPath, "utf8");
  const lines = raw.split("\n").filter((line) => line.trim().length > 0);
  const [, ...rows] = lines; // drop the header row
  const catalog = new Map<string, CatalogRow>();

  for (const line of rows) {
    const cells = line.split("\t");
    if (cells.length < MIN_CATALOG_COLUMNS) {
      continue;
    }
    const [path, type, domain, title, summary] = cells;
    const slug = basename(path.trim(), ".md");
    catalog.set(slug, {
      type: type.trim(),
      domain: domain.trim(),
      title: title.trim(),
      summary: summary.trim(),
    });
  }

  return catalog;
}

/**
 * The vault's `_system/build.py` regenerates the catalog on demand, not on
 * every edit. A catalog older than the newest wiki file may still describe
 * an already-edited page under a stale domain/summary — this class of drift
 * (a vault digest going silently out of sync with the source files) has
 * bitten the importer three times, so it fails loudly instead.
 *
 * Only pages that carry a catalog row can make the catalog stale. The `moc-*`
 * and `generated: true` pages have none by design, and `build.py` rewrites
 * them in the same run that writes the catalog — writing the catalog first, so
 * a MOC lands a millisecond later and would otherwise trip this check on every
 * freshly built vault.
 */
export async function assertCatalogFresh(
  catalogPath: string,
  parsed: readonly ParsedWikiFile[]
): Promise<void> {
  const { mtime: catalogMtime } = await stat(catalogPath);
  const newest = parsed
    .filter((file) => !(isMocSlug(file.source.slug) || file.isGenerated))
    .reduce<ParsedWikiFile | null>(
      (latest, file) => (latest && latest.mtime > file.mtime ? latest : file),
      null
    );
  if (newest && catalogMtime < newest.mtime) {
    throw new Error(
      `${catalogPath} is stale: it was built ${catalogMtime.toISOString()}, ` +
        `but ${newest.source.slug} was edited ${newest.mtime.toISOString()}. ` +
        "Re-run `_system/build.py` in the vault to regenerate the catalog."
    );
  }
}
