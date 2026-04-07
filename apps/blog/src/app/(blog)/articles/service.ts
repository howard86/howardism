import "server-only";

import { join } from "node:path";

import glob from "fast-glob";
import type { StaticImageData } from "next/image";
import { cache } from "react";

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
  date: string;
  description: string;
  image: {
    src: StaticImageData;
    alt: string;
  };
  title: string;
}

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

export const getSlicedArticles = cache(
  async (count?: number): Promise<Normalise<ArticleEntity>> => {
    const articles = await getArticles();

    return {
      ids: articles.ids.slice(0, count),
      entities: articles.entities,
    };
  }
);
