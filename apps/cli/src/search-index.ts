/**
 * Build `apps/blog/src/data/search-index.json` from the blog's committed MDX
 * articles — the published source of truth — plus the link graph the wiki
 * importer emits. Each entry carries its frontmatter and a run of related
 * keywords; it carries no article text.
 *
 * The index used to store a 600-char prefix of each body. That prefix was every
 * article's lead and nothing more (all 275 articles ran past the cap, median
 * body 7,974 chars, so it indexed 6.7% of the corpus) while costing 55KB of the
 * 103KB gzipped payload and half the per-query time. Related keywords cover
 * what the *whole* article connects to instead: measured over a 24-query sweep,
 * 101KB→61KB gzipped, 23.5ms→16ms a query, 241→252 results, and the top hit
 * matches a full-text index on 23/24 queries rather than 22/24.
 *
 * Reads `article-graph.json`, so it must run after `import:wiki`.
 *
 *   bun run build:search-index            # write the index
 *   DRY_RUN=1 bun run build:search-index  # report counts without writing
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  type ArticleGraph,
  parseArticleGraph,
  transpose,
} from "@howardism/article-contract/manifests/graph";
import {
  type SearchIndex,
  type SearchIndexEntry,
  SearchIndexSchema,
} from "@howardism/article-contract/manifests/search-index";
import matter from "gray-matter";

export type {
  SearchIndex,
  SearchIndexEntry,
} from "@howardism/article-contract/manifests/search-index";

const MDX_SUFFIX = /\.mdx$/;

/**
 * How many related keywords each entry keeps. Ranked by how many neighbours
 * share the keyword, so the cut takes the tail. 32 buys two more results across
 * the sweep for another 5KB gzipped; 12 gives up nine. 20 is the knee.
 */
const KEYWORD_LIMIT = 20;

const HERE = dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = resolve(HERE, "../../../");
const ARTICLES_DIR = resolve(REPO_ROOT, "apps/blog/src/content/articles");
const GRAPH_PATH = resolve(REPO_ROOT, "apps/blog/src/data/article-graph.json");
// Override lets a dry-run redirect the write into a temp dir instead of the
// working checkout — mirrors the importer's *_OUTPUT_PATH envs.
const OUTPUT_PATH = process.env.SEARCH_INDEX_OUTPUT_PATH
  ? resolve(process.env.SEARCH_INDEX_OUTPUT_PATH)
  : resolve(REPO_ROOT, "apps/blog/src/data/search-index.json");

/** An entry before its keywords are derived — keywords need the whole corpus. */
export type PartialSearchEntry = Omit<SearchIndexEntry, "keywords">;

/**
 * Reduce a single article's frontmatter to a search entry, or `null` when the
 * article is archived (hidden from the public blog, so kept out of search).
 * The MDX body is not read: see `deriveKeywords` for what replaced it.
 */
export function buildSearchEntry(
  raw: string,
  slug: string
): PartialSearchEntry | null {
  const { data } = matter(raw);
  if (data.archived === true) {
    return null;
  }
  return {
    slug,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    tag: String(data.tag ?? ""),
    ...(data.domain ? { domain: String(data.domain) } : {}),
    ...(Array.isArray(data.tags) && data.tags.length > 0
      ? { tags: (data.tags as unknown[]).map(String) }
      : {}),
  };
}

/**
 * Every slug `slug` links to, is linked from, or is listed as related to.
 * Outbound links come from the caller's transposed `backlinks` map, since the
 * manifest itself only stores the inbound direction. Backlink edges carry a
 * weight object in the current manifest shape and a bare slug in the legacy
 * one; the contract accepts both, so both are normalised.
 */
function neighbourSlugs(
  graph: ArticleGraph,
  slug: string,
  outgoing: Map<string, string[]>
): Set<string> {
  return new Set([
    ...(graph.backlinks[slug] ?? []).map((edge) => edge.slug),
    ...(outgoing.get(slug) ?? []),
    ...(graph.related[slug] ?? []),
  ]);
}

/**
 * An article's related keywords: the free-form tags of its graph neighbours,
 * ranked by how many neighbours carry each one, minus the tags the article
 * already has (those are indexed separately, at a higher weight).
 *
 * This is why the keywords beat a body prefix — a neighbour's tags describe the
 * whole neighbour, so one hop out summarises a region of the wiki that no
 * amount of lead text reaches. Joined into one string rather than kept as an
 * array: Fuse scores an array key by its best element, which lets short tokens
 * fuzz-match too easily (top-hit accuracy 23/24 → 17/24 on the sweep).
 */
export function deriveKeywords(
  entry: PartialSearchEntry,
  graph: ArticleGraph,
  tagsBySlug: Map<string, string[]>,
  outgoing: Map<string, string[]>,
  limit = KEYWORD_LIMIT
): string {
  const own = new Set(entry.tags ?? []);
  const shared = new Map<string, number>();
  for (const neighbour of neighbourSlugs(graph, entry.slug, outgoing)) {
    for (const tag of tagsBySlug.get(neighbour) ?? []) {
      if (!own.has(tag)) {
        shared.set(tag, (shared.get(tag) ?? 0) + 1);
      }
    }
  }
  return [...shared.entries()]
    .sort(([tagA, countA], [tagB, countB]) =>
      countB === countA ? tagA.localeCompare(tagB) : countB - countA
    )
    .slice(0, limit)
    .map(([tag]) => tag)
    .join(" ");
}

async function buildIndex(generatedOn: string): Promise<SearchIndex> {
  const graph = parseArticleGraph(
    JSON.parse(await readFile(GRAPH_PATH, "utf8"))
  );
  const filenames = (await readdir(ARTICLES_DIR))
    .filter((name) => MDX_SUFFIX.test(name))
    .sort();

  const partials: PartialSearchEntry[] = [];
  for (const filename of filenames) {
    const raw = await readFile(resolve(ARTICLES_DIR, filename), "utf8");
    const entry = buildSearchEntry(raw, filename.replace(MDX_SUFFIX, ""));
    if (entry) {
      partials.push(entry);
    }
  }
  partials.sort((a, b) => a.slug.localeCompare(b.slug));

  const tagsBySlug = new Map(
    partials.map((entry) => [entry.slug, entry.tags ?? []])
  );
  const outgoing = transpose(graph.backlinks);
  const entries = partials.map((entry) => ({
    ...entry,
    keywords: deriveKeywords(entry, graph, tagsBySlug, outgoing),
  }));

  return { generatedOn, entries };
}

/**
 * Build the search index and write it to `OUTPUT_PATH`, unless a dry run was
 * requested (`DRY_RUN=1` env var, or `options.dryRun` for callers driving
 * this programmatically, e.g. the wiki importer).
 */
export async function writeSearchIndex(options?: {
  dryRun?: boolean;
}): Promise<{ entryCount: number; outputPath: string }> {
  const generatedOn = new Date().toISOString().slice(0, 10);
  const index = await buildIndex(generatedOn);
  const json = JSON.stringify(SearchIndexSchema.parse(index), null, 2);

  const keywordless = index.entries.filter(
    (entry) => entry.keywords.length === 0
  ).length;
  if (keywordless > 0) {
    // A stale or partial `article-graph.json` is the usual cause, and it fails
    // silently otherwise: the index still builds, just without its lowest key.
    console.warn(
      `[search-index] ${keywordless} entries have no keywords — is article-graph.json current? (run import:wiki first)`
    );
  }

  if (process.env.DRY_RUN === "1" || options?.dryRun) {
    console.log(
      `[search-index] DRY_RUN — ${index.entries.length} entries, ${json.length} bytes (not written)`
    );
    return { entryCount: index.entries.length, outputPath: OUTPUT_PATH };
  }

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${json}\n`, "utf8");
  console.log(
    `[search-index] wrote ${index.entries.length} entries → ${OUTPUT_PATH}`
  );
  return { entryCount: index.entries.length, outputPath: OUTPUT_PATH };
}

if (import.meta.main) {
  writeSearchIndex().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
