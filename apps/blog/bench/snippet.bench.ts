// Benchmarks search palette per-render costs (O7): buildSnippet used purely
// as a boolean predicate vs. matchesQuery, and the unmemoised buildFacets
// fallback call.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildFacets } from "../src/components/search/scope-bar";
import {
  buildSnippet,
  matchesQuery,
  type SearchEntry,
} from "../src/components/search/search-data";
import { bench, checksum, DATA_DIR, log } from "./harness";

interface SearchIndexFile {
  entries: SearchEntry[];
}

const { entries } = JSON.parse(
  readFileSync(join(DATA_DIR, "search-index.json"), "utf8")
) as SearchIndexFile;

const ROWS = entries.filter((e) => (e.tags?.length ?? 0) > 0).slice(0, 12);
const QUERIES = ["agent", "reasoning model", "the code quality"];

function viaBuildSnippet(): boolean[] {
  const matches: boolean[] = [];
  for (const row of ROWS) {
    for (const tag of row.tags ?? []) {
      for (const query of QUERIES) {
        matches.push(buildSnippet(tag, query) !== null);
      }
    }
  }
  return matches;
}

function viaMatchesQuery(): boolean[] {
  const matches: boolean[] = [];
  for (const row of ROWS) {
    for (const tag of row.tags ?? []) {
      for (const query of QUERIES) {
        matches.push(matchesQuery(tag, query.trim().toLowerCase()));
      }
    }
  }
  return matches;
}

const before = bench("buildSnippet(tag, query) !== null", viaBuildSnippet);
log(`  checksum: ${checksum(before)}`);

const after = bench("matchesQuery(tag, lowerQuery)", viaMatchesQuery);
log(`  checksum: ${checksum(after)}`);

const FACET_RUNS = 20;
const facetsOut = bench("buildFacets(entries) x20", () => {
  let last: ReturnType<typeof buildFacets> = [];
  for (let i = 0; i < FACET_RUNS; i++) {
    last = buildFacets(entries);
  }
  return last;
});
log(`  checksum: ${checksum(facetsOut)}`);
