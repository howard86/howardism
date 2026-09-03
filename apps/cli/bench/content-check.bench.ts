// The content-integrity gate over the real corpus: the per-article parse and
// the two whole-manifest scans. Reads only — `main()` is not invoked.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseArticleGraph } from "@howardism/article-contract/manifests/graph";

import {
  type ArticleRecord,
  checkArticlesMeta,
  checkGraphSlugRefs,
  parseArticle,
} from "../src/content-check";
import { bench, checksum, DATA_DIR, log, readCorpus } from "./harness";

const readData = (name: string): unknown =>
  JSON.parse(readFileSync(join(DATA_DIR, name), "utf8"));

const corpus = readCorpus();
const graph = parseArticleGraph(readData("article-graph.json"));
const articlesMeta = readData("articles-meta.json");

const articles = bench("parseArticle × corpus", () =>
  corpus.map((file) => parseArticle(file.text, file.slug))
);
log(`  checksum ${checksum(articles)}`);

const slugs = new Set(articles.map((article: ArticleRecord) => article.slug));
const graphRefs = bench("checkGraphSlugRefs", () =>
  checkGraphSlugRefs(graph, slugs)
);
log(`  checksum ${checksum(graphRefs)}  messages ${graphRefs.length}`);

const metaRefs = bench("checkArticlesMeta", () =>
  checkArticlesMeta(articles, articlesMeta)
);
log(`  checksum ${checksum(metaRefs)}  messages ${metaRefs.length}`);
