/**
 * Build `apps/blog/src/data/articles-meta.json` from the blog's committed MDX
 * articles — the published source of truth. Each entry is one article's
 * validated frontmatter plus the `surfaceHash` of the file it came from.
 *
 * The blog reads this for its article list (it used to dynamically import all
 * 427 compiled MDX modules to recover the same frontmatter) and for the zh-TW
 * stale-translation badge (it used to re-read each source file, from a path the
 * deployed function does not carry).
 *
 * Reads the committed articles, so it must run after `import:wiki`.
 *
 *   bun run build:articles-meta
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  ArticleMetaSchema,
  type ArticlesMetaManifest,
  ArticlesMetaManifestSchema,
} from "@howardism/article-contract/manifests/articles-meta";
import { surfaceHash } from "@howardism/article-contract/surface";
import matter from "gray-matter";
import YAML from "yaml";

import { runWithConcurrency } from "./concurrency";

const MDX_SUFFIX = /\.mdx$/;
/** Enough to keep the disk busy without exhausting file descriptors. */
const READ_CONCURRENCY = 16;
/**
 * gray-matter defaults to js-yaml, which reads an unquoted `date: 2026-06-15`
 * as a JS Date. The blog's MDX pipeline uses the `yaml` package (YAML 1.2 core
 * schema, no timestamp type), which keeps it the string the contract expects,
 * so parse with the same engine. Passing options also skips gray-matter's
 * process-global cache, which would otherwise retain every article body.
 */
const MATTER_OPTIONS = { engines: { yaml: (raw: string) => YAML.parse(raw) } };

const HERE = dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = resolve(HERE, "../../../");
const ARTICLES_DIR = resolve(REPO_ROOT, "apps/blog/src/content/articles");
const OUTPUT_PATH = resolve(REPO_ROOT, "apps/blog/src/data/articles-meta.json");

/**
 * Date descending, then slug ascending. Dates are ISO `YYYY-MM-DD`, so the
 * string order is the calendar order; the slug tiebreak makes the file
 * byte-stable across regenerations.
 */
function byDateDescThenSlug(
  a: { meta: { date: string }; slug: string },
  b: { meta: { date: string }; slug: string }
): number {
  return a.meta.date === b.meta.date
    ? a.slug.localeCompare(b.slug)
    : b.meta.date.localeCompare(a.meta.date);
}

export async function buildArticlesMeta(
  generatedOn: string
): Promise<ArticlesMetaManifest> {
  const filenames = (await readdir(ARTICLES_DIR))
    .filter((name) => MDX_SUFFIX.test(name))
    .sort();

  const articles = await runWithConcurrency(
    filenames,
    READ_CONCURRENCY,
    async (filename) => {
      const slug = filename.replace(MDX_SUFFIX, "");
      const raw = await readFile(resolve(ARTICLES_DIR, filename), "utf8");
      const parsed = ArticleMetaSchema.safeParse(
        matter(raw, MATTER_OPTIONS).data
      );
      if (!parsed.success) {
        throw new Error(
          `Invalid article frontmatter for "${slug}": ${parsed.error.message}`
        );
      }
      return { slug, sourceHash: surfaceHash(raw), meta: parsed.data };
    }
  );
  articles.sort(byDateDescThenSlug);

  return { generatedOn, articles };
}

export async function writeArticlesMeta(): Promise<{
  entryCount: number;
  outputPath: string;
}> {
  const generatedOn = new Date().toISOString().slice(0, 10);
  const manifest = await buildArticlesMeta(generatedOn);
  // Through the schema, not the raw object: zod returns each key in schema
  // order, which is the order the committed file is already in.
  const json = JSON.stringify(
    ArticlesMetaManifestSchema.parse(manifest),
    null,
    2
  );

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${json}\n`, "utf8");
  console.log(
    `[articles-meta] wrote ${manifest.articles.length} entries → ${OUTPUT_PATH}`
  );
  return { entryCount: manifest.articles.length, outputPath: OUTPUT_PATH };
}

if (import.meta.main) {
  writeArticlesMeta().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
