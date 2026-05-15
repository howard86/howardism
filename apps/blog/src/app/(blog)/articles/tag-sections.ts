import "server-only";

import { type ArticleEntity, getArticlesByTag } from "./service";
import type { ArticleTag } from "./taxonomy";

export interface TagSection {
  /** Short marketing-y sentence shown under the section heading / page intro. */
  intro: string;
  /** Meta-description used for `/articles/tag/[tag]` SEO. */
  metaDescription: string;
  /** URL slug used for `/articles/tag/[slug]`. */
  slug: TagSectionSlug;
  /** Set of `ArticleTag`s that compose this display section. */
  tags: readonly ArticleTag[];
  /** Display heading. */
  title: string;
}

/**
 * URL slugs surfaced by `generateStaticParams` and the index page. Keep this
 * list in lockstep with `TAG_SECTIONS` and `RECOGNISED_TAG_SLUGS`.
 */
export type TagSectionSlug = "concept" | "entity" | "essay" | "index";

/**
 * Canonical display sections for the dense `/articles` ledger and the
 * `/articles/tag/[tag]` dynamic route. The order here drives section order
 * on the index page.
 *
 * The Index section folds `"Changelog"`-tagged articles in alongside
 * `"Index"` — both surface meta/wiki-housekeeping content and we don't want
 * to leak the importer's bookkeeping distinction into the reader-facing UI.
 */
export const TAG_SECTIONS: readonly TagSection[] = [
  {
    slug: "concept",
    tags: ["Concept"],
    title: "Concept",
    intro: "Patterns, frameworks, and abstractions worth a name.",
    metaDescription:
      "Concept articles from the Howardism wiki — patterns, frameworks, and abstractions distilled from practice.",
  },
  {
    slug: "entity",
    tags: ["Entity"],
    title: "Entity",
    intro: "Short profiles of people, products, and organisations.",
    metaDescription:
      "Entity articles — short profiles of the people, products, and organisations shaping the Howardism notebook.",
  },
  {
    slug: "essay",
    tags: ["Essay"],
    title: "Essay",
    intro: "Longer-form arguments and reflections.",
    metaDescription:
      "Essay articles — longer-form arguments and reflections from the Howardism wiki.",
  },
  {
    slug: "index",
    tags: ["Index", "Changelog"],
    title: "Index",
    intro: "Catalogs, change logs, and meta-articles about the wiki itself.",
    metaDescription:
      "Index articles — catalogs, change logs, and meta-articles describing the Howardism wiki.",
  },
];

const SECTIONS_BY_SLUG: ReadonlyMap<string, TagSection> = new Map(
  TAG_SECTIONS.map((section) => [section.slug, section])
);

/**
 * Resolve a (possibly user-supplied) URL segment to a canonical section.
 * Returns `null` if the slug isn't a recognised tag — callers should
 * surface a `notFound()`.
 */
export function resolveTagSection(rawSlug: string): TagSection | null {
  return SECTIONS_BY_SLUG.get(rawSlug.toLowerCase()) ?? null;
}

/**
 * Materialise the articles for a section, merging multiple `ArticleTag`s
 * (e.g. Index + Changelog) into a single date-desc list. Inherits
 * visibility filtering from `getArticlesByTag`.
 */
export async function getSectionArticles(
  section: TagSection
): Promise<ArticleEntity[]> {
  const groups = await Promise.all(
    section.tags.map((t) => getArticlesByTag(t))
  );
  return groups
    .flat()
    .sort(
      (a, b) =>
        new Date(b.meta.date).valueOf() - new Date(a.meta.date).valueOf()
    );
}
