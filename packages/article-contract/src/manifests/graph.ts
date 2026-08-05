import { z } from "zod";

/**
 * The link graph the wiki importer emits to `apps/blog/src/data/article-graph.json`
 * and the blog reads at build time. Every value array is sorted deterministically
 * and archived nodes are filtered out on the write side, so every slug referenced
 * is also a key. A slug absent from a map has no edges (treat as `[]`).
 */
const slugList = z.array(z.string());

const BacklinkEdgeObject = z.object({
  /**
   * The citing line as plain text, when the citation sits in prose. Absent for
   * bare index entries (a MOC list item, a table row) — nothing worth quoting.
   */
  context: z.string().optional(),
  /** How many times the citing article links here. Drives the sort order. */
  count: z.number().int().positive(),
  slug: z.string(),
});

export type BacklinkEdge = z.infer<typeof BacklinkEdgeObject>;

/**
 * Backlink entries, ranked by citation weight. Manifests written before the
 * edges carried weight/context store a bare slug; those normalise to a single
 * context-free citation so every reader sees one shape.
 */
const backlinkList = z.array(
  z.union([
    BacklinkEdgeObject,
    z.string().transform((slug): BacklinkEdge => ({ count: 1, slug })),
  ])
);

export const ArticleGraphSchema = z.object({
  backlinks: z.record(z.string(), backlinkList),
  generatedOn: z.string(),
  related: z.record(z.string(), slugList),
});

export type ArticleGraph = z.infer<typeof ArticleGraphSchema>;

/** Parse + validate a raw article-graph manifest; throws on drift. */
export const parseArticleGraph = (data: unknown): ArticleGraph =>
  ArticleGraphSchema.parse(data);

/**
 * Outbound edges, derived from `backlinks` — `a -> b` exists iff `backlinks[b]`
 * contains `a`. The manifest stores only the inbound direction; this rebuilds
 * the other one for callers that need it. Every backlink key is present, so a
 * slug with no outbound links maps to an empty array.
 */
export const transpose = (
  backlinks: ArticleGraph["backlinks"]
): Map<string, string[]> => {
  const out = new Map<string, string[]>(
    Object.keys(backlinks).map((slug) => [slug, []])
  );
  for (const [target, edges] of Object.entries(backlinks)) {
    for (const edge of edges) {
      out.get(edge.slug)?.push(target);
    }
  }
  return out;
};
