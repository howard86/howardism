export const WIKI_TAGS = ["Concept", "Entity", "Essay", "Index"] as const;

export type WikiTag = (typeof WIKI_TAGS)[number];

/**
 * The wiki's curated knowledge domains — the blog's primary browse axis.
 *
 * The first fourteen mirror the vault's `moc-*` Map-of-Content pages (slug =
 * `moc-<domain>` minus the prefix) and are sourced from `index.md`'s
 * `### <Domain> ([[moc-…|MOC]])` headings. `syntheses` is the catch-all for
 * `derived/` essays, which the vault does not file under a single domain.
 */
export const WIKI_DOMAINS = [
  "agent-systems",
  "agent-security",
  "ai-coding-practice",
  "evals-and-benchmarks",
  "model-capability-and-training",
  "alignment-and-safety",
  "interpretability",
  "interaction-multimodal",
  "formal-math",
  "startup-founder",
  "product-org",
  "ai-economics-and-labor",
  "superintelligence-trajectory",
  "entities",
  "syntheses",
] as const;

export type WikiDomain = (typeof WIKI_DOMAINS)[number];

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
  /**
   * Curated knowledge domain the note belongs to, resolved by the importer
   * from `index.md`'s MOC groupings (derived notes fall back to `syntheses`).
   * Drives the home page's domain plate stack and `/articles/domain/[domain]`.
   */
  domain?: WikiDomain;
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
   * `domain` (the single curated bucket); these drive the tag chips and
   * `/articles/tagged/[tag]` routes. Omitted when the note has no tags.
   */
  tags?: string[];
  title: string;
}
