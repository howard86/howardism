import { z } from "zod";

import { WIKI_DOMAINS, WIKI_TAGS } from "../index";

/**
 * One searchable article in `apps/blog/src/data/search-index.json`. `domain` and
 * `tag` stay loose strings (not the WikiDomain/WikiTag enums): the search index
 * must tolerate a new domain landing before an enum bump, so the write-gate does
 * not reject it. Read-side, the blog loads this chunk in the browser, so it
 * shares the inferred type but does NOT zod-parse on read — the write-gate is
 * the validation point. See parseSearchIndex (used CLI-side only).
 *
 * There is no article text here. `description` is the summary an article is
 * matched on; `keywords` carries what it *relates to* (see the CLI's index
 * builder). Shipping a body prefix instead cost 40% more bytes for fewer
 * results — an agent or reader who needs the prose fetches the article.
 */
export const SearchIndexEntrySchema = z.object({
  description: z.string(),
  domain: z.string().optional(),
  /**
   * Space-joined related keywords, ranked. One string rather than `string[]`
   * deliberately: as an array key Fuse scores by best-matching element, and
   * short tokens fuzz-match too easily — that encoding dropped top-hit
   * accuracy from 23/24 to 17/24 on the query sweep.
   */
  keywords: z.string(),
  slug: z.string(),
  tag: z.string(),
  tags: z.array(z.string()).optional(),
  title: z.string(),
});

export type SearchIndexEntry = z.infer<typeof SearchIndexEntrySchema>;

export const SearchIndexSchema = z.object({
  entries: z.array(SearchIndexEntrySchema),
  generatedOn: z.string(),
});

export type SearchIndex = z.infer<typeof SearchIndexSchema>;

/** Parse + validate a raw search index; used to gate the CLI write, not reads. */
export const parseSearchIndex = (data: unknown): SearchIndex =>
  SearchIndexSchema.parse(data);

export const ArticleNavigationEntrySchema = z.object({
  archived: z.boolean(),
  date: z.string(),
  description: z.string(),
  domain: z.enum(WIKI_DOMAINS).optional(),
  slug: z.string(),
  tag: z.enum(WIKI_TAGS),
  tags: z.array(z.string()),
  title: z.string(),
});

export type ArticleNavigationEntry = z.infer<
  typeof ArticleNavigationEntrySchema
>;

export const ArticleNavigationManifestSchema = z.object({
  entries: z.array(ArticleNavigationEntrySchema),
  generatedOn: z.string(),
});

export type ArticleNavigationManifest = z.infer<
  typeof ArticleNavigationManifestSchema
>;

export const parseArticleNavigation = (
  data: unknown
): ArticleNavigationManifest => ArticleNavigationManifestSchema.parse(data);
