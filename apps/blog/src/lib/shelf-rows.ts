import type { WikiDomain } from "@howardism/article-contract";

import type { ReadingEntry } from "./reading-store";

/** Article metadata the Shelf needs to render a history row, from the manifest. */
export interface ShelfManifestEntry {
  /** Whether the article was archived after being read (still opens). */
  archived: boolean;
  /** Domain key for accent color and filtering; unset for domainless kinds. */
  domain?: WikiDomain;
  /** Link to the top of the article. */
  href: string;
  /** Kind letter for the row marker (C / E / S / I). */
  kindPrefix: string;
  /** Domain display name, or the article kind when it has no domain. */
  label: string;
  /** Estimated reading time in minutes. */
  readingTime: number;
  slug: string;
  /** Free-form subject tags, rendered as chips. */
  tags: string[];
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
  /**
   * 1-based accession number: the order this article entered the shelf, by
   * first read. Fixed for the life of the entry, so the row marker stays put
   * under any sort or filter.
   */
  accession: number;
  kind: ShelfRowKind;
  lastReadAt: number;
  pct: number;
  slug: string;
}

/** A read that still maps to an article (visible or archived). */
export interface LinkedShelfRow extends ShelfRowBase {
  domain?: WikiDomain;
  href: string;
  kind: "resolved" | "archived";
  kindPrefix: string;
  label: string;
  readingTime: number;
  tags: string[];
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
 * Each row also carries its accession number, ranked by first read so the
 * marker survives re-sorting and filtering.
 */
export function buildShelfRows(
  history: readonly ReadingEntry[],
  manifest: readonly ShelfManifestEntry[]
): ShelfRow[] {
  const bySlug = new Map(manifest.map((entry) => [entry.slug, entry]));
  const accessionBySlug = new Map(
    [...history]
      .sort((a, b) => a.firstReadAt - b.firstReadAt)
      .map((entry, index) => [entry.slug, index + 1] as const)
  );
  const rows: ShelfRow[] = [];
  for (const entry of history) {
    const base = {
      slug: entry.slug,
      pct: entry.pct,
      lastReadAt: entry.lastReadAt,
      accession: accessionBySlug.get(entry.slug) ?? 0,
    };
    const meta = bySlug.get(entry.slug);
    if (meta) {
      rows.push({
        ...base,
        kind: meta.archived ? "archived" : "resolved",
        title: meta.title,
        label: meta.label,
        href: meta.href,
        domain: meta.domain,
        kindPrefix: meta.kindPrefix,
        readingTime: meta.readingTime,
        tags: meta.tags,
      });
    } else {
      rows.push({ ...base, kind: "deleted" });
    }
  }
  return rows;
}
