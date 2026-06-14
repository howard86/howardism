import type { ReadingEntry } from "./reading-store";

/** Article metadata the Shelf needs to render a history row, from the manifest. */
export interface ShelfManifestEntry {
  /** Whether the article was archived after being read (still opens). */
  archived: boolean;
  /** Link to the top of the article. */
  href: string;
  /** Domain display name, or the article kind when it has no domain. */
  label: string;
  slug: string;
  title: string;
}

/**
 * How a stored read resolves against the current corpus:
 * - `resolved` — a currently-visible article.
 * - `archived` — read before it was archived; still opens, just tagged.
 * - `deleted` — the slug no longer resolves at all; rendered as a tombstone.
 */
export type ShelfRowKind = "resolved" | "archived" | "deleted";

interface ShelfRowBase {
  kind: ShelfRowKind;
  lastReadAt: number;
  pct: number;
  slug: string;
}

/** A read that still maps to an article (visible or archived). */
export interface LinkedShelfRow extends ShelfRowBase {
  href: string;
  kind: "resolved" | "archived";
  label: string;
  title: string;
}

/** A read whose article no longer exists — a dismissible tombstone. */
export interface DeletedShelfRow extends ShelfRowBase {
  kind: "deleted";
}

export type ShelfRow = LinkedShelfRow | DeletedShelfRow;

/**
 * Join reading history against the full article manifest (visible + archived),
 * preserving the history's most-recent-first order. Every stored read yields a
 * row classified as resolved, archived, or deleted — nothing is dropped, so a
 * deleted article surfaces as a tombstone the reader dismisses on their terms.
 */
export function buildShelfRows(
  history: readonly ReadingEntry[],
  manifest: readonly ShelfManifestEntry[]
): ShelfRow[] {
  const bySlug = new Map(manifest.map((entry) => [entry.slug, entry]));
  const rows: ShelfRow[] = [];
  for (const entry of history) {
    const base = {
      slug: entry.slug,
      pct: entry.pct,
      lastReadAt: entry.lastReadAt,
    };
    const meta = bySlug.get(entry.slug);
    if (meta) {
      rows.push({
        ...base,
        kind: meta.archived ? "archived" : "resolved",
        title: meta.title,
        label: meta.label,
        href: meta.href,
      });
    } else {
      rows.push({ ...base, kind: "deleted" });
    }
  }
  return rows;
}
