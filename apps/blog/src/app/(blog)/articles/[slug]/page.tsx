import type { Metadata } from "next";

import { env } from "@/config/env";

import { importArticleModule, renderArticle } from "../render-article";
import { articleExists, getArticles } from "../service";

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Prerendered at build time, one HTML file per article, archived ones included
// (they are noindex via metadata). Content ships with each build, so
// `dynamicParams` is off — it must be a static literal, and `output: "export"`
// forbids `true` — and an unknown slug 404s.
export const dynamicParams = false;
export const revalidate = false;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const { ids } = await getArticles();
  return ids.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!(await articleExists(slug))) {
    return {};
  }
  const mod = await importArticleModule(slug, "en");
  const url = `${env.NEXT_PUBLIC_DOMAIN_NAME}/articles/${slug}`;
  const ogImage = {
    url: mod.heroImage.src,
    width: mod.heroImage.width,
    height: mod.heroImage.height,
    alt: mod.meta.imageAlt,
  };

  return {
    title: mod.meta.title,
    description: mod.meta.description,
    alternates: { canonical: url },
    ...(mod.meta.archived === true && {
      robots: { index: false, follow: false },
    }),
    openGraph: {
      type: "article",
      url,
      title: mod.meta.title,
      description: mod.meta.description,
      publishedTime: mod.meta.date,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: mod.meta.title,
      description: mod.meta.description,
      images: [ogImage.url],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  return renderArticle({ slug, locale: "en" });
}
