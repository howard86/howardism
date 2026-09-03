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
  /**
   * Epoch ms of the first recorded read — the Shelf's accession order, which
   * never changes once set. Histories written before this field existed
   * backfill it from `lastReadAt` on read.
   */
  firstReadAt: number;
  /** Epoch ms of the most recent read, for the relative "last read" time. */
  lastReadAt: number;
  /** Latest scroll fraction (0–1), for the row's progress indicator. */
  pct: number;
  /** Article slug; the join key against the article manifest. */
  slug: string;
}

/** The stored shape: `firstReadAt` is absent in pre-accession histories. */
type StoredReadingEntry = Omit<ReadingEntry, "firstReadAt"> &
  Partial<Pick<ReadingEntry, "firstReadAt">>;

/** localStorage key holding the resume state for a single article. */
export const perSlugKey = (slug: string): string => PER_SLUG_PREFIX + slug;

function isReadingEntry(value: unknown): value is StoredReadingEntry {
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
 * Module-level caches of the parsed history and saved list: a listing page's
 * SaveButton column checks `isSaved` once per row, and a scroll handler calls
 * `recordProgress` every tick, so re-reading and re-parsing localStorage on
 * every call is wasted work. Every writer below refreshes these directly
 * (rather than merely invalidating them), so the very next read never
 * re-parses what the writer just produced. A `storage` listener invalidates
 * them on a cross-tab change, since another tab's writes bypass these.
 */
let historyCache: ReadingEntry[] | null = null;
let savedCache: SavedEntry[] | null = null;
let savedSlugSetCache: ReadonlySet<string> | null = null;

function invalidateCaches(): void {
  historyCache = null;
  savedCache = null;
  savedSlugSetCache = null;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", invalidateCaches);
}

/** Test-only: clears the module-level caches so the next read re-parses. */
export const resetReadingStoreCache = invalidateCaches;

/**
 * Reading history, most-recent-first. Returns `[]` when storage is
 * unavailable (private browsing) or the stored value is missing/corrupt.
 */
export function getHistory(): ReadingEntry[] {
  if (historyCache) {
    return historyCache;
  }
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      historyCache = [];
      return historyCache;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      historyCache = [];
      return historyCache;
    }
    historyCache = parsed.filter(isReadingEntry).map((entry) => ({
      ...entry,
      firstReadAt: entry.firstReadAt ?? entry.lastReadAt,
    }));
  } catch {
    historyCache = [];
  }
  return historyCache;
}

/**
 * Record (or refresh) a read once it crosses the meaningful-read threshold:
 * moves the slug to the front, updates its last-read time and progress, and
 * caps the list at the 50 most recent — evicting older entries and dropping
 * their per-slug resume state along with them. One pass finds and drops the
 * existing entry (if any), then an unshift + splice re-caps in place. Below-
 * threshold scrolls and any storage error are silently ignored, so a reader
 * in private browsing sees no failure.
 */
export function recordProgress(slug: string, pct: number): void {
  if (pct < MIN_RECORD_PCT) {
    return;
  }
  const now = Date.now();
  const history = getHistory();
  let firstReadAt = now;
  const withoutSlug: ReadingEntry[] = [];
  for (const entry of history) {
    if (entry.slug === slug) {
      firstReadAt = entry.firstReadAt;
    } else {
      withoutSlug.push(entry);
    }
  }
  withoutSlug.unshift({ slug, pct, lastReadAt: now, firstReadAt });
  const evicted = withoutSlug.splice(MAX_HISTORY);
  historyCache = withoutSlug;
  try {
    for (const entry of evicted) {
      localStorage.removeItem(perSlugKey(entry.slug));
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(withoutSlug));
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
  const next = getHistory().filter((entry) => entry.slug !== slug);
  historyCache = next;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    localStorage.removeItem(perSlugKey(slug));
  } catch {
    // ignore storage errors (quota / private mode)
  }
}

/* ── save-for-later (deliberate, uncapped, separate from history) ── */

/**
 * The save-for-later list, newest-saved first. Uncapped — only the reader
 * trims it by unsaving. Returns `[]` when storage is unavailable or corrupt.
 */
export function getSaved(): SavedEntry[] {
  if (savedCache) {
    return savedCache;
  }
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) {
      savedCache = [];
      return savedCache;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      savedCache = [];
      return savedCache;
    }
    savedCache = parsed.filter(isSavedEntry);
  } catch {
    savedCache = [];
  }
  return savedCache;
}

/** `getSaved()`'s slugs as a Set, for O(1) membership checks (`isSaved`). */
export function getSavedSlugSet(): ReadonlySet<string> {
  savedSlugSetCache ??= new Set(getSaved().map((entry) => entry.slug));
  return savedSlugSetCache;
}

/** Whether `slug` is currently saved for later. */
export function isSaved(slug: string): boolean {
  return getSavedSlugSet().has(slug);
}

/**
 * Toggle `slug`'s saved state, persisting the change, and return the new state
 * (`true` if it is now saved). Saving moves it to the front; the list is never
 * auto-trimmed. Storage errors are swallowed; the returned state (and cache)
 * still reflect the intended toggle so the control stays responsive.
 */
export function toggleSave(slug: string): boolean {
  const saved = getSaved();
  const wasSaved = saved.some((entry) => entry.slug === slug);
  const next = wasSaved
    ? saved.filter((entry) => entry.slug !== slug)
    : [{ slug, savedAt: Date.now() }, ...saved];
  savedCache = next;
  savedSlugSetCache = new Set(next.map((entry) => entry.slug));
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors (quota / private mode)
  }
  return !wasSaved;
}

/* ── wipe everything (privacy / fresh start) ── */

/**
 * Erase all reading state from this browser: the history index, the saved
 * list, and every per-slug resume entry. After this the Shelf is empty and
 * in-article resume chips no longer appear (they read the same per-slug keys).
 * Storage errors are silently ignored.
 */
export function clearReadingData(): void {
  historyCache = [];
  savedCache = [];
  savedSlugSetCache = new Set();
  try {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(SAVED_KEY);
    // Collect per-slug keys first — removing during iteration shifts indices.
    const perSlugKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(PER_SLUG_PREFIX)) {
        perSlugKeys.push(key);
      }
    }
    for (const key of perSlugKeys) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore storage errors (quota / private mode)
  }
}
