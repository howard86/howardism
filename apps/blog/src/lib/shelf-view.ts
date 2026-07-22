/**
 * Pure view logic for the Shelf page: recency buckets, sort orders, the
 * masthead stats, and the done/in-progress threshold. No React and no storage
 * access — everything takes plain rows plus an explicit `now`, so the page
 * components and tests share the same math.
 */

const DAY_MS = 24 * 3_600_000;
const WEEK_MS = 7 * DAY_MS;
/** Calendar-ish month window for the "Earlier this month" bucket. */
const MONTH_MS = 31 * DAY_MS;

/** At or above this scroll fraction a read renders as "✓ read". */
export const DONE_PCT = 0.95;

/** A read still worth resuming (the store only records reads ≥ 25%). */
export const isInProgress = (pct: number): boolean => pct < DONE_PCT;

/** Group labels for the History tab, index-aligned with `bucketOf`. */
export const BUCKET_LABELS = [
  "Today",
  "Yesterday",
  "Earlier this week",
  "Earlier this month",
  "Older",
] as const;

/**
 * Recency bucket index (0–4) for a read. Buckets are rolling 24-hour windows
 * from `now`, not calendar days — no timezone math, matching the streak.
 */
export function bucketOf(lastReadAt: number, now: number): number {
  const age = now - lastReadAt;
  if (age < DAY_MS) {
    return 0;
  }
  if (age < 2 * DAY_MS) {
    return 1;
  }
  if (age < WEEK_MS) {
    return 2;
  }
  if (age < MONTH_MS) {
    return 3;
  }
  return 4;
}

/** The read facts the sorts and stats need; `LinkedShelfRow` satisfies it. */
export interface ShelfRead {
  lastReadAt: number;
  pct: number;
  readingTime: number;
}

/** The Shelf's sort orders. */
export type ShelfSort = "longest" | "progress" | "recent";

/** Comparators per sort; ties fall back to most recent first. */
export const SHELF_SORT_COMPARATORS: Record<
  ShelfSort,
  (a: ShelfRead, b: ShelfRead) => number
> = {
  recent: (a, b) => b.lastReadAt - a.lastReadAt,
  progress: (a, b) => b.pct - a.pct || b.lastReadAt - a.lastReadAt,
  longest: (a, b) =>
    b.readingTime - a.readingTime || b.lastReadAt - a.lastReadAt,
};

export interface ShelfStats {
  /** Estimated hours on the page: Σ readingTime × pct. */
  hours: number;
  notesRead: number;
  thisWeek: number;
}

/** The masthead stats, computed over the (undismissed) reading history. */
export function computeShelfStats(
  reads: readonly ShelfRead[],
  now: number
): ShelfStats {
  let thisWeek = 0;
  let minutes = 0;
  for (const read of reads) {
    const age = now - read.lastReadAt;
    if (age < WEEK_MS) {
      thisWeek += 1;
    }
    minutes += read.readingTime * Math.min(read.pct, 1);
  }
  return {
    notesRead: reads.length,
    thisWeek,
    hours: minutes / 60,
  };
}
