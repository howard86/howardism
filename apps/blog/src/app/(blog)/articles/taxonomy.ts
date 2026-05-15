/**
 * Shared, client-safe article taxonomy constants. Lives outside
 * `service.ts` because that file is `server-only` and pulls in Node-only
 * modules (`fast-glob`) — importing the type or `ARTICLE_TOPICS` constant
 * from there into a client component would drag the whole server bundle
 * along.
 *
 * Mirrors `WIKI_TAGS` in `apps/cli/src/import-wiki/emit.ts`. Keep the
 * unions aligned with the wiki importer, which is the source of truth
 * for what can appear in graph-derived articles.
 */
export type ArticleTag = "Concept" | "Entity" | "Essay" | "Index" | "Changelog";

export const ARTICLE_TAGS: readonly ArticleTag[] = [
  "Concept",
  "Entity",
  "Essay",
  "Index",
  "Changelog",
];

/**
 * Initial topic taxonomy drawn from the existing article clusters.
 * Optional in frontmatter because new pieces may land before a topic is
 * assigned, and the Changelog deliberately stays untagged.
 */
export type ArticleTopic =
  | "interaction"
  | "alignment"
  | "harness"
  | "product"
  | "org";

export const ARTICLE_TOPICS: readonly ArticleTopic[] = [
  "interaction",
  "alignment",
  "harness",
  "product",
  "org",
];
