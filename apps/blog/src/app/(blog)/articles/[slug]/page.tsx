import type { Metadata } from "next";
import type { StaticImageData } from "next/image";
import type { FC } from "react";

import { env } from "@/config/env";

import {
  type ArticleMeta,
  getArticles,
  getHeadings,
  getSiblings,
} from "../service";
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
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const mod = (await import(`@/content/articles/${slug}.mdx`)) as ArticleModule;
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
  const [mod, { previousSlug, nextSlug, position }, headings] =
    await Promise.all([
      import(`@/content/articles/${slug}.mdx`) as Promise<ArticleModule>,
      getSiblings(slug),
      getHeadings(slug),
    ]);

  return (
    <ArticleLayout
      headings={headings}
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
