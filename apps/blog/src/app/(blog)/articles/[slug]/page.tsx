import type { Metadata } from "next";
import type { FC } from "react";

import {
  type ArticleEntity,
  type ArticleMeta,
  getArticles,
  type Normalise,
} from "../service";
import { ArticleLayout } from "./ArticleLayout";

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "error";

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = await import(`./(docs)/${slug}/page.mdx`).then(
    (file) => file.meta
  );

  return {
    title: meta.title,
    description: meta.description,
  };
}

const getSiblingSlug = (
  articles: Normalise<ArticleEntity>,
  slug: string,
  difference: number
): string | undefined => {
  const selectedArticle = articles.entities[slug];

  if (!selectedArticle) {
    return undefined;
  }

  return articles.ids[selectedArticle.position + difference];
};

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const mod = (await import(`./(docs)/${slug}/page.mdx`)) as {
    meta: ArticleMeta;
    default: FC;
  };

  const articles = await getArticles();

  const position = (articles.entities[slug]?.position ?? 0) + 1;

  return (
    <ArticleLayout
      meta={mod.meta}
      nextSlug={getSiblingSlug(articles, slug, -1)}
      position={position}
      previousSlug={getSiblingSlug(articles, slug, 1)}
    >
      <mod.default />
    </ArticleLayout>
  );
}

export async function generateStaticParams() {
  const articles = await getArticles();

  return articles.ids.map((slug) => ({ slug }));
}
