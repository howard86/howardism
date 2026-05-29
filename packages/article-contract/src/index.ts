export const WIKI_TAGS = ["Concept", "Entity", "Essay", "Index"] as const;

export type WikiTag = (typeof WIKI_TAGS)[number];

export const WIKI_TOPICS = [
  "interaction",
  "architecture",
  "harness",
  "alignment",
  "orgs",
] as const;

export type WikiTopic = (typeof WIKI_TOPICS)[number];

export interface SourceRef {
  title: string;
  url?: string;
}

/**
 * Write-side article contract: exactly the fields the wiki importer emits into
 * MDX frontmatter and the blog validates on read. Blog-only read-time fields
 * (archived, dropCap, imageAlt) are NOT here — see ./schema and the blog.
 */
export interface ArticleContract {
  date: string;
  description: string;
  readingTime: number;
  /**
   * Audit trail of external source documents the article was synthesised from.
   * Set by the wiki importer from `raw/<slug>.md` frontmatter; the rendered
   * `## Sources` block in the MDX body is derived from this list.
   */
  sources?: SourceRef[];
  /** The article "kind" (Concept/Entity/Essay/Index). */
  tag: WikiTag;
  /**
   * The wiki note's free-form subject labels (lowercase kebab), passed through
   * verbatim by the importer. Distinct from singular `tag` (the kind) and from
   * `topic` (the single derived bucket); these drive the tag chips and
   * `/articles/tagged/[tag]` routes. Omitted when the note has no tags.
   */
  tags?: string[];
  title: string;
  /**
   * Curated subject bucket derived by the importer from the note's `tags`.
   * Drives the home page's topic plate stack. Absent on non-topical pages.
   */
  topic?: WikiTopic;
}
