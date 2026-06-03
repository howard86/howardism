import { z } from "zod";

/**
 * One searchable article in `apps/blog/src/data/search-index.json`. `domain` and
 * `tag` stay loose strings (not the WikiDomain/WikiTag enums): the search index
 * must tolerate a new domain landing before an enum bump, so the write-gate does
 * not reject it. Read-side, the blog loads this ~800KB chunk in the browser, so
 * it shares the inferred type but does NOT zod-parse on read — the write-gate is
 * the validation point. See parseSearchIndex (used CLI-side only).
 */
export const SearchIndexEntrySchema = z.object({
  body: z.string(),
  description: z.string(),
  domain: z.string().optional(),
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
