import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import type { FC } from "react";

import { type ArticleMeta, getArticles, getSiblings } from "../service";
import { ArticleLayout } from "./article-layout";

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface ArticleModule {
  default: FC;
  heroImage: StaticImageData;
  meta: ArticleMeta;
}

export const dynamic = "error";

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const mod = (await import(`./(docs)/${slug}/page.mdx`)) as ArticleModule;

  return {
    title: mod.meta.title,
    description: mod.meta.description,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const mod = (await import(`./(docs)/${slug}/page.mdx`)) as ArticleModule;

  const { previousSlug, nextSlug, position } = await getSiblings(slug);

  return (
    <ArticleLayout
      heroImage={mod.heroImage}
      meta={mod.meta}
      nextSlug={nextSlug}
      position={position}
      previousSlug={previousSlug}
      slug={slug}
    >
      <mod.default />
    </ArticleLayout>
  );
}

export async function generateStaticParams() {
  const articles = await getArticles();

  return articles.ids.map((slug) => ({ slug }));
}
