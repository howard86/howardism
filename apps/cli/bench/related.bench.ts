// A5: computeRelated scores all N^2 slug pairs to keep the top 5 of each.
// Inputs are rebuilt from the committed graph the way buildArticleGraph
// holds them, so the result can be diffed against the committed `related`.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { computeRelated } from "../src/import-wiki/pages/graph.ts";
import { bench, checksum, DATA_DIR, log } from "./harness.ts";

interface CommittedGraph {
  backlinks: Record<string, { slug: string }[]>;
  related: Record<string, string[]>;
}

const graph: CommittedGraph = JSON.parse(
  readFileSync(join(DATA_DIR, "article-graph.json"), "utf8")
);

const sortedSlugs = Object.keys(graph.backlinks).sort();
const backlinkSets = new Map(
  sortedSlugs.map((slug) => [slug, new Set<string>()])
);
const outgoingSets = new Map(
  sortedSlugs.map((slug) => [slug, new Set<string>()])
);
for (const [target, edges] of Object.entries(graph.backlinks)) {
  for (const edge of edges) {
    backlinkSets.get(target)?.add(edge.slug);
    outgoingSets.get(edge.slug)?.add(target);
  }
}

const related = bench("computeRelated over article-graph", () =>
  computeRelated(sortedSlugs, outgoingSets, backlinkSets)
);

let drift = 0;
for (const slug of sortedSlugs) {
  if (JSON.stringify(related[slug]) !== JSON.stringify(graph.related[slug])) {
    drift += 1;
    log(`  DRIFT ${slug}`);
  }
}

log(
  `  slugs ${sortedSlugs.length}  differs from committed related ${drift}  checksum ${checksum(related)}`
);
