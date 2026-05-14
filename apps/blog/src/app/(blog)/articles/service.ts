import "server-only";

import { join } from "node:path";

import glob from "fast-glob";
import type { StaticImageData } from "next/image";
import { cache } from "react";

import graphData from "@/data/article-graph.json";

export interface Normalise<T> {
  entities: Record<string, T | undefined>;
  ids: string[];
}

export interface ArticleEntity {
  meta: ArticleMeta;
  position: number;
  slug: string;
}

export interface ArticleMeta {
  archived?: boolean;
  date: string;
  description: string;
  dropCap?: boolean;
  image: {
    src: StaticImageData;
    alt: string;
  };
  readingTime: number;
  tag: string;
  title: string;
}

export interface SiblingNav {
  nextSlug: string | undefined;
  position: number;
  previousSlug: string | undefined;
}

/**
 * Mirror of `WIKI_TAGS` in `apps/cli/src/import-wiki/emit.ts`. Keep these
 * unions aligned — the wiki importer is the source of truth for which tags
 * can appear in graph-derived articles.
 */
export type ArticleTag = "Concept" | "Entity" | "Essay" | "Index" | "Changelog";

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

const ARTICLE_TAGS: readonly ArticleTag[] = [
  "Concept",
  "Entity",
  "Essay",
  "Index",
  "Changelog",
];

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

const PAGE_MDX_SUFFIX = /\/page.mdx$/;

export const getArticles = cache(
  async (): Promise<Normalise<ArticleEntity>> => {
    const filenames = await glob("**/page.mdx", {
      cwd: join(
        process.cwd(),
        "src",
        "app",
        "(blog)",
        "articles",
        "[slug]",
        "(docs)"
      ),
    });

    const files = await Promise.all(
      filenames.map(async (filename) => {
        const meta = await import(`./[slug]/(docs)/${filename}`).then(
          (m) => m.meta as ArticleMeta
        );

        return {
          slug: filename.replace(PAGE_MDX_SUFFIX, ""),
          meta,
        };
      })
    );

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
