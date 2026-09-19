import { z } from "zod";

import { ArticleContractSchema } from "../schema";

/**
 * An article's frontmatter as the blog reads it: the write-side contract plus
 * the three fields the importer does not own (`archived`, `dropCap`,
 * `imageAlt`). This is the shape the blog's article service hands to every
 * consumer, so the manifest below carries it verbatim.
 */
export const ArticleMetaSchema = ArticleContractSchema.extend({
  archived: z.boolean().optional(),
  dropCap: z.boolean().optional(),
  imageAlt: z.string(),
});

export type ArticleMeta = z.infer<typeof ArticleMetaSchema>;

/**
 * Every committed MDX article's frontmatter, plus the `surfaceHash` of the file
 * it was read from. Built by `bun run build:articles-meta` from the articles
 * themselves, so it must run after `import:wiki`.
 *
 * The blog used to recover this by dynamically importing all 427 compiled MDX
 * modules for their `meta` export (~200ms per process, on every cold start) and
 * to re-read each source file to detect a stale translation (a path that does
 * not exist in the deployed function at all). Both read this instead; the
 * `sourceHash` is exactly what the translation tracker records, so comparing
 * the two is the same staleness test `translate:check` runs.
 *
 * Articles are ordered date-descending then slug-ascending — the order the
 * service's `ids` array preserves.
 */
export const ArticlesMetaManifestSchema = z.object({
  generatedOn: z.string(),
  articles: z.array(
    z.object({
      slug: z.string(),
      sourceHash: z.string(),
      meta: ArticleMetaSchema,
    })
  ),
});

export type ArticlesMetaManifest = z.infer<typeof ArticlesMetaManifestSchema>;

/** Parse + validate a raw articles-meta manifest; throws on drift. */
export const parseArticlesMeta = (data: unknown): ArticlesMetaManifest =>
  ArticlesMetaManifestSchema.parse(data);

/**
 * A non-default locale's committed article frontmatter, built by the same
 * `bun run build:articles-meta` pass from `src/content/articles-<locale>`.
 *
 * The zh-TW index used to recover this by dynamically importing all 274
 * compiled translation modules — component tree and hero-image chain included —
 * for their `meta` export alone; the same cost `ArticlesMetaManifestSchema`
 * removed on the English side.
 *
 * Deliberately NOT the full {@link ArticleMetaSchema}. Two reasons:
 *
 * 1. A translation's frontmatter is a snapshot of its English source as of the
 *    day it was translated, so its enum fields can lag the live taxonomy — two
 *    of the 274 committed zh-TW articles still carry a retired `domain` today.
 *    Those fields are locale-invariant and the blog reads them from the English
 *    manifest, so re-validating a stale copy of them here would fail the build
 *    over drift nothing reads.
 * 2. `title` and `description` are the only fields translation actually
 *    rewrites; `date` comes along because the index sorts on it.
 *
 * No `sourceHash` either: staleness compares the ENGLISH source's hash (carried
 * by `articles-meta.json` and `translations.json`), so a hash of the
 * translation would have no reader.
 *
 * Articles are ordered date-descending then slug-ascending, as above.
 */
export const LocalizedArticleMetaSchema = z.object({
  date: z.string(),
  description: z.string(),
  title: z.string(),
});

export type LocalizedArticleMeta = z.infer<typeof LocalizedArticleMetaSchema>;

export const LocalizedArticlesMetaManifestSchema = z.object({
  generatedOn: z.string(),
  locale: z.string(),
  articles: z.array(
    z.object({
      slug: z.string(),
      meta: LocalizedArticleMetaSchema,
    })
  ),
});

export type LocalizedArticlesMetaManifest = z.infer<
  typeof LocalizedArticlesMetaManifestSchema
>;

/** Parse + validate a raw localized articles-meta manifest; throws on drift. */
export const parseLocalizedArticlesMeta = (
  data: unknown
): LocalizedArticlesMetaManifest =>
  LocalizedArticlesMetaManifestSchema.parse(data);
