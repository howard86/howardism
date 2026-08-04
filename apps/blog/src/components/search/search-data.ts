import type {
  SearchIndex,
  SearchIndexEntry,
} from "@howardism/article-contract/manifests/search-index";

/**
 * One searchable article. The shape is owned by `@howardism/article-contract`
 * and gated at write time by the CLI; this chunk loads in the browser, so it is
 * read against the shared type without a zod parse on read.
 */
export type SearchEntry = SearchIndexEntry;

let indexPromise: Promise<SearchEntry[]> | null = null;

/**
 * Lazily fetch the prebuilt search index. The dynamic import keeps the JSON out
 * of the main bundle — it loads only when the palette first opens — and the
 * cached promise means repeat opens never refetch.
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
 * query doesn't appear in `text` — e.g. the row matched on its title, or on a
 * keyword that the summary never spells out.
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
    // Longest token first, not query order: "the attention mechanism" would
    // otherwise highlight the leading "The" — the least selective word in the
    // query, and usually the first character of the article.
    const token = trimmed
      .toLowerCase()
      .split(TOKEN_SPLIT_RE)
      .filter(
        (part) => part.length >= MIN_TOKEN_LENGTH && lowerText.includes(part)
      )
      .sort((a, b) => b.length - a.length)[0];
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
