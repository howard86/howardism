/**
 * Browser-local reading history for the Shelf. Owns the `howardism:reading*`
 * localStorage namespace: the most-recent-first history index plus the
 * per-slug resume state written by the article reader. A pure client module
 * (no React) so later Shelf slices can reuse it without re-implementing the
 * storage contract. None of this is a build manifest — it never enters
 * `@howardism/article-contract`.
 */

/** Per-slug resume-progress key prefix (shared with the resume chip). */
const PER_SLUG_PREFIX = "howardism:reading:";
/** History index key. Distinct from the per-slug prefix (no trailing colon). */
const HISTORY_KEY = "howardism:reading-history";
/** Save-for-later index key. Uncapped, newest-saved first. */
const SAVED_KEY = "howardism:reading-saved";
/** Below this scroll fraction a read isn't worth remembering. */
const MIN_RECORD_PCT = 0.25;
/** Most-recent reads to keep; older reads are evicted LRU-style. */
const MAX_HISTORY = 50;

export interface ReadingEntry {
  /** Epoch ms of the most recent read, for the relative "last read" time. */
  lastReadAt: number;
  /** Latest scroll fraction (0–1), for the row's progress indicator. */
  pct: number;
  /** Article slug; the join key against the article manifest. */
  slug: string;
}

/** localStorage key holding the resume state for a single article. */
export const perSlugKey = (slug: string): string => PER_SLUG_PREFIX + slug;

function isReadingEntry(value: unknown): value is ReadingEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.slug === "string" &&
    typeof entry.pct === "number" &&
    typeof entry.lastReadAt === "number"
  );
}

/**
 * Reading history, most-recent-first. Returns `[]` when storage is
 * unavailable (private browsing) or the stored value is missing/corrupt.
 */
export function getHistory(): ReadingEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isReadingEntry);
  } catch {
    return [];
  }
}

/**
 * Record (or refresh) a read once it crosses the meaningful-read threshold:
 * moves the slug to the front, updates its last-read time and progress, and
 * caps the list at the 50 most recent — evicting older entries and dropping
 * their per-slug resume state along with them. Below-threshold scrolls and any
 * storage error are silently ignored, so a reader in private browsing sees no
 * failure.
 */
export function recordProgress(slug: string, pct: number): void {
  if (pct < MIN_RECORD_PCT) {
    return;
  }
  try {
    const withoutSlug = getHistory().filter((entry) => entry.slug !== slug);
    const next: ReadingEntry[] = [
      { slug, pct, lastReadAt: Date.now() },
      ...withoutSlug,
    ];
    const kept = next.slice(0, MAX_HISTORY);
    for (const evicted of next.slice(MAX_HISTORY)) {
      localStorage.removeItem(perSlugKey(evicted.slug));
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(kept));
  } catch {
    // ignore storage errors (quota / private mode)
  }
}

/**
 * Forget a single read: drop it from the history index and delete its per-slug
 * resume state. Backs both the per-row "remove" control and the "dismiss" on a
 * no-longer-available tombstone. Storage errors are silently ignored.
 */
export function removeFromHistory(slug: string): void {
  try {
    const next = getHistory().filter((entry) => entry.slug !== slug);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    localStorage.removeItem(perSlugKey(slug));
  } catch {
    // ignore storage errors (quota / private mode)
  }
}

/* ── save-for-later (deliberate, uncapped, separate from history) ── */

export interface SavedEntry {
  /** Epoch ms when the article was saved, for newest-first ordering. */
  savedAt: number;
  /** Article slug; the join key against the article manifest. */
  slug: string;
}

function isSavedEntry(value: unknown): value is SavedEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return typeof entry.slug === "string" && typeof entry.savedAt === "number";
}

/**
 * The save-for-later list, newest-saved first. Uncapped — only the reader
 * trims it by unsaving. Returns `[]` when storage is unavailable or corrupt.
 */
export function getSaved(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isSavedEntry);
  } catch {
    return [];
  }
}

/** Whether `slug` is currently saved for later. */
export function isSaved(slug: string): boolean {
  return getSaved().some((entry) => entry.slug === slug);
}

/**
 * Toggle `slug`'s saved state, persisting the change, and return the new state
 * (`true` if it is now saved). Saving moves it to the front; the list is never
 * auto-trimmed. Storage errors are swallowed; the returned state still
 * reflects the intended toggle so the control stays responsive.
 */
export function toggleSave(slug: string): boolean {
  const saved = getSaved();
  const wasSaved = saved.some((entry) => entry.slug === slug);
  const next = wasSaved
    ? saved.filter((entry) => entry.slug !== slug)
    : [{ slug, savedAt: Date.now() }, ...saved];
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors (quota / private mode)
  }
  return !wasSaved;
}
