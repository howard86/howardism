import type {
  SearchIndex,
  SearchIndexEntry,
} from "@howardism/article-contract/manifests/search-index";
import Fuse, { type IFuseOptions } from "fuse.js";

/**
 * One searchable article. The shape is owned by `@howardism/article-contract`
 * and gated at write time by the CLI; this ~800KB chunk loads in the browser, so
 * it is read against the shared type without a zod parse on read.
 */
export type SearchEntry = SearchIndexEntry;

const FUSE_OPTIONS: IFuseOptions<SearchEntry> = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "tags", weight: 0.18 },
    { name: "domain", weight: 0.12 },
    { name: "description", weight: 0.12 },
    { name: "tag", weight: 0.1 },
    { name: "body", weight: 0.08 },
  ],
  // Body text is long; match anywhere rather than penalising position.
  ignoreLocation: true,
  includeScore: true,
  threshold: 0.35,
  minMatchCharLength: 2,
};

const DEFAULT_LIMIT = 12;

let indexPromise: Promise<SearchEntry[]> | null = null;

/**
 * Lazily fetch the prebuilt search index. The dynamic import keeps the ~800KB
 * JSON out of the main bundle — it loads only when the palette first opens —
 * and the cached promise means repeat opens never refetch.
 */
export function loadSearchIndex(): Promise<SearchEntry[]> {
  if (!indexPromise) {
    indexPromise = import("@/data/search-index.json")
      .then((mod) => (mod.default as SearchIndex).entries)
      .catch((err) => {
        // Drop the cached rejection so a later open retries the chunk fetch
        // instead of being stuck with a permanently-failed promise.
        indexPromise = null;
        throw err;
      });
  }
  return indexPromise;
}

export function createFuse(entries: SearchEntry[]): Fuse<SearchEntry> {
  return new Fuse(entries, FUSE_OPTIONS);
}

export function searchEntries(
  fuse: Fuse<SearchEntry>,
  query: string,
  limit = DEFAULT_LIMIT
): SearchEntry[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }
  return fuse.search(trimmed, { limit }).map((result) => result.item);
}

export interface Snippet {
  after: string;
  before: string;
  match: string;
}

const SNIPPET_RADIUS = 90;
const TOKEN_SPLIT_RE = /\s+/;
const MIN_TOKEN_LENGTH = 2;

/**
 * Carve a short window of `text` around the first occurrence of `query` (or one
 * of its tokens), splitting it into the text before / the matched span / the
 * text after so the caller can emphasise the match. Returns `null` when the
 * query doesn't appear in `text` (e.g. it only matched the title) — the caller
 * falls back to the description.
 */
export function buildSnippet(
  text: string,
  query: string,
  radius = SNIPPET_RADIUS
): Snippet | null {
  const trimmed = query.trim();
  if (trimmed.length === 0 || text.length === 0) {
    return null;
  }

  const lowerText = text.toLowerCase();
  let index = lowerText.indexOf(trimmed.toLowerCase());
  let matchLength = trimmed.length;

  if (index === -1) {
    const token = trimmed
      .toLowerCase()
      .split(TOKEN_SPLIT_RE)
      .find(
        (part) => part.length >= MIN_TOKEN_LENGTH && lowerText.includes(part)
      );
    if (!token) {
      return null;
    }
    index = lowerText.indexOf(token);
    matchLength = token.length;
  }

  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + matchLength + radius);

  return {
    before: (start > 0 ? "…" : "") + text.slice(start, index),
    match: text.slice(index, index + matchLength),
    after:
      text.slice(index + matchLength, end) + (end < text.length ? "…" : ""),
  };
}
