import Fuse, { type IFuseOptions } from "fuse.js";

import type { SearchIndexEntry } from "./manifests/search-index";

const FUSE_OPTIONS: IFuseOptions<SearchIndexEntry> = {
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

export function createFuse(
  entries: SearchIndexEntry[]
): Fuse<SearchIndexEntry> {
  return new Fuse(entries, FUSE_OPTIONS);
}

export function searchEntries(
  fuse: Fuse<SearchIndexEntry>,
  query: string,
  limit = DEFAULT_LIMIT
): SearchIndexEntry[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }
  return fuse.search(trimmed, { limit }).map((result) => result.item);
}
