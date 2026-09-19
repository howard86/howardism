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
 * The same pass emits `articles-meta.zh-TW.json` from the committed
 * translations, which backs the `/zh-TW/articles` index — it had the identical
 * problem, dynamically importing all 274 compiled zh-TW modules for three
 * frontmatter fields.
 *
 * Reads the committed articles, so it must run after `import:wiki`.
 *
 *   bun run build:articles-meta
 */
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  ArticleMetaSchema,
  type ArticlesMetaManifest,
  ArticlesMetaManifestSchema,
  LocalizedArticleMetaSchema,
  type LocalizedArticlesMetaManifest,
  LocalizedArticlesMetaManifestSchema,
} from "@howardism/article-contract/manifests/articles-meta";
import {
  type ParsedFrontmatter,
  surfaceHashFrom,
} from "@howardism/article-contract/surface";
import matter from "gray-matter";
import YAML from "yaml";
import type { z } from "zod";

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
/** The one non-default locale the blog serves — see `PREFIXED_LOCALES`. */
const ZH_LOCALE = "zh-TW";
const ZH_ARTICLES_DIR = resolve(
  REPO_ROOT,
  "apps/blog/src/content/articles-zh-TW"
);
const ZH_OUTPUT_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/data/articles-meta.zh-TW.json"
);

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

/**
 * Every MDX file in `dir` as `{ slug, raw, meta }`, frontmatter validated.
 * Shared by the English and localized passes; only the English one goes on to
 * hash the file.
 */
async function readArticleDir<T>(
  dir: string,
  schema: { safeParse: (data: unknown) => z.ZodSafeParseResult<T> }
): Promise<{ meta: T; parsed: ParsedFrontmatter; slug: string }[]> {
  const filenames = (await readdir(dir))
    .filter((name) => MDX_SUFFIX.test(name))
    .sort();

  return await runWithConcurrency(
    filenames,
    READ_CONCURRENCY,
    async (filename) => {
      const slug = filename.replace(MDX_SUFFIX, "");
      const raw = await Bun.file(resolve(dir, filename)).text();
      const parsed = matter(raw, MATTER_OPTIONS);
      const validated = schema.safeParse(parsed.data);
      if (!validated.success) {
        throw new Error(
          `Invalid article frontmatter for "${slug}": ${validated.error.message}`
        );
      }
      return { slug, parsed, meta: validated.data };
    }
  );
}

export async function buildArticlesMeta(
  generatedOn: string
): Promise<ArticlesMetaManifest> {
  const read = await readArticleDir(ARTICLES_DIR, ArticleMetaSchema);
  const articles = read.map(({ slug, parsed, meta }) => ({
    slug,
    sourceHash: surfaceHashFrom(parsed),
    meta,
  }));
  articles.sort(byDateDescThenSlug);

  return { generatedOn, articles };
}

/**
 * The same frontmatter table for a translated locale. No `sourceHash`: the
 * staleness check compares the *English* source hash, which the English
 * manifest and `translations.json` already carry.
 */
export async function buildLocalizedArticlesMeta(
  generatedOn: string,
  locale: string,
  dir: string
): Promise<LocalizedArticlesMetaManifest> {
  const read = await readArticleDir(dir, LocalizedArticleMetaSchema);
  const articles = read.map(({ slug, meta }) => ({ slug, meta }));
  articles.sort(byDateDescThenSlug);

  return { generatedOn, locale, articles };
}

export async function writeArticlesMeta(): Promise<{
  entryCount: number;
  localizedEntryCount: number;
  localizedOutputPath: string;
  outputPath: string;
}> {
  const generatedOn = new Date().toISOString().slice(0, 10);
  const [manifest, localized] = await Promise.all([
    buildArticlesMeta(generatedOn),
    buildLocalizedArticlesMeta(generatedOn, ZH_LOCALE, ZH_ARTICLES_DIR),
  ]);
  // Through the schema, not the raw object: zod returns each key in schema
  // order, which is the order the committed file is already in.
  const json = JSON.stringify(
    ArticlesMetaManifestSchema.parse(manifest),
    null,
    2
  );
  const localizedJson = JSON.stringify(
    LocalizedArticlesMetaManifestSchema.parse(localized),
    null,
    2
  );

  await Bun.write(OUTPUT_PATH, `${json}\n`);
  await Bun.write(ZH_OUTPUT_PATH, `${localizedJson}\n`);
  console.log(
    `[articles-meta] wrote ${manifest.articles.length} entries → ${OUTPUT_PATH}`
  );
  console.log(
    `[articles-meta] wrote ${localized.articles.length} ${ZH_LOCALE} entries → ${ZH_OUTPUT_PATH}`
  );
  return {
    entryCount: manifest.articles.length,
    localizedEntryCount: localized.articles.length,
    localizedOutputPath: ZH_OUTPUT_PATH,
    outputPath: OUTPUT_PATH,
  };
}

if (import.meta.main) {
  writeArticlesMeta().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
