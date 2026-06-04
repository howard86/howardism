/**
 * Build `apps/blog/src/data/search-index.json` from the blog's committed MDX
 * articles — the published source of truth. Needs no Obsidian vault: it reads
 * each article's frontmatter + body and reduces the body to searchable plain
 * text via `toPlainText`. Re-run after editing or importing articles, then
 * commit the result (like the other `src/data/*.json` manifests).
 *
 *   bun run build:search-index            # write the index
 *   DRY_RUN=1 bun run build:search-index  # report counts without writing
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  type SearchIndex,
  type SearchIndexEntry,
  SearchIndexSchema,
} from "@howardism/article-contract/manifests/search-index";
import matter from "gray-matter";

import { toPlainText } from "./import-wiki/plain-text.ts";

export type {
  SearchIndex,
  SearchIndexEntry,
} from "@howardism/article-contract/manifests/search-index";

const MDX_SUFFIX = /\.mdx$/;
// The `export { default as heroImage } …` line every emitted MDX carries right
// after its frontmatter — module syntax, not prose, so drop it before indexing.
const HERO_EXPORT_RE = /^export \{ default as heroImage \}[^\n]*\n?/m;

const HERE = dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = resolve(HERE, "../../../");
const ARTICLES_DIR = resolve(REPO_ROOT, "apps/blog/src/content/articles");
const OUTPUT_PATH = resolve(REPO_ROOT, "apps/blog/src/data/search-index.json");

/**
 * Reduce a single article's raw MDX source to a search entry, or `null` when
 * the article is archived (hidden from the public blog, so kept out of search).
 */
export function buildSearchEntry(
  raw: string,
  slug: string
): SearchIndexEntry | null {
  const { data, content } = matter(raw);
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
    body: toPlainText(content.replace(HERO_EXPORT_RE, "")),
  };
}

async function buildIndex(generatedOn: string): Promise<SearchIndex> {
  const filenames = (await readdir(ARTICLES_DIR))
    .filter((name) => MDX_SUFFIX.test(name))
    .sort();

  const entries: SearchIndexEntry[] = [];
  for (const filename of filenames) {
    const raw = await readFile(resolve(ARTICLES_DIR, filename), "utf8");
    const entry = buildSearchEntry(raw, filename.replace(MDX_SUFFIX, ""));
    if (entry) {
      entries.push(entry);
    }
  }
  entries.sort((a, b) => a.slug.localeCompare(b.slug));

  return { generatedOn, entries };
}

async function main(): Promise<void> {
  const generatedOn = new Date().toISOString().slice(0, 10);
  const index = await buildIndex(generatedOn);
  const json = JSON.stringify(SearchIndexSchema.parse(index));

  if (process.env.DRY_RUN === "1") {
    console.log(
      `[search-index] DRY_RUN — ${index.entries.length} entries, ${json.length} bytes (not written)`
    );
    return;
  }

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${json}\n`, "utf8");
  console.log(
    `[search-index] wrote ${index.entries.length} entries → ${OUTPUT_PATH}`
  );
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
