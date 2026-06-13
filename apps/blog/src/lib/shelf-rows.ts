import type { ReadingEntry } from "./reading-store";

/** Resolved article metadata the Shelf needs to render a history row. */
export interface ShelfManifestEntry {
  /** Link to the top of the article. */
  href: string;
  /** Domain display name, or the article kind when it has no domain. */
  label: string;
  slug: string;
  title: string;
}

/** A history entry resolved against the manifest into a renderable row. */
export interface ShelfRow extends ShelfManifestEntry {
  lastReadAt: number;
  pct: number;
}

/**
 * Join reading history against the article manifest, preserving the history's
 * most-recent-first order. Entries whose slug is absent from the manifest (an
 * article that no longer exists) drop out silently — a later slice turns those
 * into tombstones; here they simply don't render.
 */
export function buildShelfRows(
  history: readonly ReadingEntry[],
  manifest: readonly ShelfManifestEntry[]
): ShelfRow[] {
  const bySlug = new Map(manifest.map((entry) => [entry.slug, entry]));
  const rows: ShelfRow[] = [];
  for (const entry of history) {
    const meta = bySlug.get(entry.slug);
    if (meta) {
      rows.push({ ...meta, pct: entry.pct, lastReadAt: entry.lastReadAt });
    }
  }
  return rows;
}
