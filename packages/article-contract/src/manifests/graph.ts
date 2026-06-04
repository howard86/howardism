import { z } from "zod";

/**
 * The link graph the wiki importer emits to `apps/blog/src/data/article-graph.json`
 * and the blog reads at build time. Every value array is sorted deterministically
 * and archived nodes are filtered out on the write side, so every slug referenced
 * is also a key. A slug absent from a map has no edges (treat as `[]`).
 */
const slugList = z.array(z.string());

export const ArticleGraphSchema = z.object({
  backlinks: z.record(z.string(), slugList),
  generatedOn: z.string(),
  outgoing: z.record(z.string(), slugList),
  related: z.record(z.string(), slugList),
});

export type ArticleGraph = z.infer<typeof ArticleGraphSchema>;

/** Parse + validate a raw article-graph manifest; throws on drift. */
export const parseArticleGraph = (data: unknown): ArticleGraph =>
  ArticleGraphSchema.parse(data);
