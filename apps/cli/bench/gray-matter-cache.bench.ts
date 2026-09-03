// Measures gray-matter's unbounded parse cache (see M4): called without
// options, `matter()` memoizes every distinct string it ever parses, forever.
// Over the full corpus that retains ~21MB no caller ever reads back. Passing
// `{}` opts out of the cache entirely (gray-matter's own `if (!options)`
// guard — see node_modules/gray-matter/index.js).
import matter from "gray-matter";

import { bench, log, readCorpus } from "./harness.ts";

// `cache`/`clearCache` aren't part of gray-matter's published types.
interface MatterCache {
  cache: Record<string, unknown>;
  clearCache: () => void;
}
const matterCache = matter as unknown as MatterCache;

function forceGc(): void {
  if (typeof Bun === "undefined") {
    globalThis.gc?.();
  } else {
    Bun.gc(true);
  }
}

const corpus = readCorpus();

matterCache.clearCache();
forceGc();
const beforeCached = process.memoryUsage().heapUsed;
bench("matter(raw) — cached", () => {
  for (const file of corpus) {
    matter(file.text);
  }
});
forceGc();
const afterCached = process.memoryUsage().heapUsed;
const cachedEntries = Object.keys(matterCache.cache).length;
log(`matter.cache entries after cached parse: ${cachedEntries}`);
log(
  `heapUsed delta (cached): ${((afterCached - beforeCached) / 1024 / 1024).toFixed(2)} MB`
);

matterCache.clearCache();
forceGc();
const beforeUncached = process.memoryUsage().heapUsed;
bench("matter(raw, {}) — uncached", () => {
  for (const file of corpus) {
    matter(file.text, {});
  }
});
forceGc();
const afterUncached = process.memoryUsage().heapUsed;
const uncachedEntries = Object.keys(matterCache.cache).length;
log(`matter.cache entries after uncached parse: ${uncachedEntries}`);
log(
  `heapUsed delta (uncached): ${((afterUncached - beforeUncached) / 1024 / 1024).toFixed(2)} MB`
);
