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
