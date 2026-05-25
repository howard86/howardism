import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import { env } from "@/config/env";

import { importArticleModule, renderArticle } from "../render-article";
import { articleExists, hasTranslation, type Locale } from "../service";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams(): { slug: string }[] {
  return [];
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const baseUrl = env.NEXT_PUBLIC_DOMAIN_NAME;

  if (locale === "zh-TW") {
    if (!hasTranslation(slug)) {
      return {};
    }
    const mod = await importArticleModule(slug, "zh-TW").catch(() => null);
    if (!mod) {
      return {};
    }
    const url = `${baseUrl}/zh-TW/articles/${slug}`;
    return {
      title: mod.meta.title,
      description: mod.meta.description,
      alternates: {
        canonical: url,
        languages: {
          en: `${baseUrl}/articles/${slug}`,
          "zh-TW": url,
          "x-default": `${baseUrl}/articles/${slug}`,
        },
      },
      openGraph: {
        type: "article",
        url,
        locale: "zh_TW",
        title: mod.meta.title,
        description: mod.meta.description,
      },
    };
  }

  if (!(await articleExists(slug))) {
    return {};
  }
  const mod = await importArticleModule(slug, "en");
  const url = `${baseUrl}/articles/${slug}`;
  const ogImage = {
    url: mod.heroImage.src,
    width: mod.heroImage.width,
    height: mod.heroImage.height,
    alt: mod.meta.imageAlt,
  };
  const languages: Record<string, string> = {
    en: url,
    "x-default": url,
  };
  if (hasTranslation(slug)) {
    languages["zh-TW"] = `${baseUrl}/zh-TW/articles/${slug}`;
  }

  return {
    title: mod.meta.title,
    description: mod.meta.description,
    alternates: { canonical: url, languages },
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
  const locale = (await getLocale()) as Locale;

  if (locale === "zh-TW") {
    if (!hasTranslation(slug)) {
      notFound();
    }
    return renderArticle({ slug, locale: "zh-TW" });
  }

  return renderArticle({ slug, locale: "en" });
}
