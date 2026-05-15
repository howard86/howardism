import "server-only";

import { join } from "node:path";

import glob from "fast-glob";
import type { StaticImageData } from "next/image";
import { cache } from "react";
import { z } from "zod";

import graphData from "@/data/article-graph.json";

import type { ArticleTag } from "./taxonomy";
import { ARTICLE_TAGS, ARTICLE_TOPICS } from "./taxonomy";

export interface Normalise<T> {
  entities: Record<string, T | undefined>;
  ids: string[];
}

export interface ArticleEntity {
  heroImage: StaticImageData;
  meta: ArticleMeta;
  position: number;
  slug: string;
}

const SourceRefSchema = z.object({
  title: z.string(),
  url: z.url().optional(),
});

export type SourceRef = z.infer<typeof SourceRefSchema>;

const ArticleMetaSchema = z.object({
  archived: z.boolean().optional(),
  date: z.string(),
  description: z.string(),
  dropCap: z.boolean().optional(),
  imageAlt: z.string(),
  readingTime: z.number(),
  /**
   * Audit trail of external source documents the article was synthesised
   * from. Set by the wiki importer from `raw/<slug>.md` frontmatter; the
   * rendered `## Sources` block in the MDX body is derived from this list.
   */
  sources: z.array(SourceRefSchema).optional(),
  tag: z.enum(ARTICLE_TAGS),
  title: z.string(),
  topic: z.enum(ARTICLE_TOPICS).optional(),
});

export type ArticleMeta = z.infer<typeof ArticleMetaSchema>;

export interface SiblingNav {
  nextSlug: string | undefined;
  position: number;
  previousSlug: string | undefined;
}

export interface ArticleLink {
  meta: ArticleMeta;
  slug: string;
}

interface ArticleGraph {
  backlinks: Record<string, readonly string[] | undefined>;
  generatedOn: string;
  outgoing: Record<string, readonly string[] | undefined>;
  related: Record<string, readonly string[] | undefined>;
}

const graph: ArticleGraph = graphData;

const isArticleTag = (value: string): value is ArticleTag =>
  (ARTICLE_TAGS as readonly string[]).includes(value);

const toArticleLinks = (
  slugs: readonly string[] | undefined,
  visible: Normalise<ArticleEntity>
): ArticleLink[] => {
  if (!slugs) {
    return [];
  }
  const links: ArticleLink[] = [];
  for (const slug of slugs) {
    const entity = visible.entities[slug];
    if (entity) {
      links.push({ slug, meta: entity.meta });
    }
  }
  return links;
};

const MDX_SUFFIX = /\.mdx$/;

interface ArticleModule {
  heroImage?: StaticImageData;
  meta?: unknown;
}

const loadArticle = async (
  filename: string
): Promise<{ heroImage: StaticImageData; meta: ArticleMeta; slug: string }> => {
  const slug = filename.replace(MDX_SUFFIX, "");
  const mod = (await import(`@/content/articles/${filename}`)) as ArticleModule;
  const parsed = ArticleMetaSchema.safeParse(mod.meta);
  if (!parsed.success) {
    throw new Error(
      `Invalid article frontmatter for "${slug}": ${parsed.error.message}`
    );
  }
  if (!mod.heroImage) {
    throw new Error(
      `Article "${slug}" is missing the \`heroImage\` named export. Re-export the hero asset: \`export { default as heroImage } from './hero.png'\`.`
    );
  }
  return { slug, meta: parsed.data, heroImage: mod.heroImage };
};

export const getArticles = cache(
  async (): Promise<Normalise<ArticleEntity>> => {
    const filenames = await glob("*.mdx", {
      cwd: join(process.cwd(), "src", "content", "articles"),
    });

    const files = await Promise.all(filenames.map(loadArticle));

    files.sort(
      (a, b) =>
        new Date(b.meta.date).valueOf() - new Date(a.meta.date).valueOf()
    );

    const results: Normalise<ArticleEntity> = {
      ids: [],
      entities: {},
    };

    files.forEach((file, index) => {
      results.ids.push(file.slug);
      results.entities[file.slug] = {
        position: index,
        ...file,
      };
    });

    return results;
  }
);

export const getVisibleArticles = cache(
  async (): Promise<Normalise<ArticleEntity>> => {
    const all = await getArticles();
    const ids = all.ids.filter((id) => !all.entities[id]?.meta.archived);
    return { ids, entities: all.entities };
  }
);

export const getSlicedArticles = cache(
  async (count?: number): Promise<Normalise<ArticleEntity>> => {
    const visible = await getVisibleArticles();
    return {
      ids: visible.ids.slice(0, count),
      entities: visible.entities,
    };
  }
);

export const getBacklinks = cache(
  async (slug: string): Promise<ArticleLink[]> => {
    const visible = await getVisibleArticles();
    return toArticleLinks(graph.backlinks[slug], visible);
  }
);

export const getOutgoing = cache(
  async (slug: string): Promise<ArticleLink[]> => {
    const visible = await getVisibleArticles();
    return toArticleLinks(graph.outgoing[slug], visible);
  }
);

export const getRelated = cache(
  async (slug: string): Promise<ArticleLink[]> => {
    const visible = await getVisibleArticles();
    return toArticleLinks(graph.related[slug], visible);
  }
);

export const getArticlesByTag = cache(
  async (tag: ArticleTag): Promise<ArticleEntity[]> => {
    const visible = await getVisibleArticles();
    const matches: ArticleEntity[] = [];
    for (const id of visible.ids) {
      const entity = visible.entities[id];
      if (entity && entity.meta.tag === tag) {
        matches.push(entity);
      }
    }
    return matches;
  }
);

export const getTagCounts = cache(
  async (): Promise<Record<ArticleTag, number>> => {
    const visible = await getVisibleArticles();
    const counts: Record<ArticleTag, number> = {
      Concept: 0,
      Entity: 0,
      Essay: 0,
      Index: 0,
      Changelog: 0,
    };
    for (const id of visible.ids) {
      const entity = visible.entities[id];
      if (!entity) {
        continue;
      }
      const { tag } = entity.meta;
      if (isArticleTag(tag)) {
        counts[tag] += 1;
      }
    }
    return counts;
  }
);

/**
 * Returns prev/next slug for the article-page footer, partitioned by archive
 * state so a visible article never links to an archived sibling and vice
 * versa. Position is 1-based within the same partition.
 */
export const getSiblings = cache(async (slug: string): Promise<SiblingNav> => {
  const all = await getArticles();
  const isArchived = all.entities[slug]?.meta.archived === true;
  const partition = all.ids.filter(
    (id) => (all.entities[id]?.meta.archived === true) === isArchived
  );
  const index = partition.indexOf(slug);
  if (index < 0) {
    return { previousSlug: undefined, nextSlug: undefined, position: 1 };
  }
  return {
    previousSlug: partition[index + 1],
    nextSlug: partition[index - 1],
    position: index + 1,
  };
});
