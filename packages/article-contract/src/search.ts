import Fuse, { type IFuseOptions } from "fuse.js";

import type { SearchIndexEntry } from "./manifests/search-index";

/**
 * Weights are unchanged; only the lowest key swapped what it points at. It used
 * to be a 600-char prefix of the article body — which was every article's lead,
 * 6.7% of the corpus, and 55KB of the 103KB gzipped index. `keywords` (the tags
 * of an article's graph neighbours) covers what the whole article relates to in
 * a fraction of the bytes: measured over a 24-query sweep, 101KB→61KB gzipped,
 * 23.5ms→16ms a query, 241→252 results, and the top hit matches a full-text
 * index on 23/24 queries rather than 22/24.
 *
 * Two tempting tunings were tried and reverted, both because they cost recall:
 * dropping the lowest key entirely, and tightening `threshold` to 0.2. Either
 * one sends ordinary multi-word queries — "attention mechanism", "llm vuln" —
 * to zero results, because 0.35 is what lets a query spanning two fields match
 * at all. The palette defers ranking (`useDeferredValue`), so the remaining
 * milliseconds do not land on the keystroke anyway.
 */
const FUSE_OPTIONS: IFuseOptions<SearchIndexEntry> = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "tags", weight: 0.18 },
    { name: "domain", weight: 0.12 },
    { name: "description", weight: 0.12 },
    { name: "tag", weight: 0.1 },
    { name: "keywords", weight: 0.08 },
  ],
  // Match anywhere in the keyword run rather than penalising position.
  ignoreLocation: true,
  includeScore: true,
  threshold: 0.35,
  minMatchCharLength: 2,
};

const DEFAULT_LIMIT = 12;

/**
 * Ceiling on caller-supplied result limits. The palette passes none; the WebMCP
 * `search_articles` tool takes one straight from a calling agent, and an
 * unbounded limit would return the whole corpus.
 */
const MAX_LIMIT = 50;

/**
 * Fuse instances keyed on the entry array they index. The index costs ~1ms to
 * build and every caller shares the one array `loadSearchIndex` caches, so
 * repeat callers — notably the WebMCP tools, which rebuilt it per invocation —
 * get it for free. Weak so a discarded index does not pin its Fuse.
 */
const fuseCache = new WeakMap<SearchIndexEntry[], Fuse<SearchIndexEntry>>();

export function createFuse(
  entries: SearchIndexEntry[]
): Fuse<SearchIndexEntry> {
  const cached = fuseCache.get(entries);
  if (cached) {
    return cached;
  }
  const fuse = new Fuse(entries, FUSE_OPTIONS);
  fuseCache.set(entries, fuse);
  return fuse;
}

/** Clamp a caller-supplied limit into `[1, MAX_LIMIT]`, defaulting when absent. */
export function resolveLimit(limit?: number): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(Math.floor(limit as number), 1), MAX_LIMIT);
}

export function searchEntries(
  fuse: Fuse<SearchIndexEntry>,
  query: string,
  limit?: number
): SearchIndexEntry[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }
  return fuse
    .search(trimmed, { limit: resolveLimit(limit) })
    .map((result) => result.item);
}
