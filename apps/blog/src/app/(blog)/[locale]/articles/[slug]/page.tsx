import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "@/config/env";

import {
  importArticleModule,
  renderArticle,
} from "../../../articles/render-article";
import {
  getTranslatedSlugs,
  hasTranslation,
  PREFIXED_LOCALES,
} from "../../../articles/service";
import {
  baseOpenGraph,
  baseTwitter,
  feedAlternates,
} from "../../../shared-metadata";

interface ZhArticlePageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Prerendered at build time, one HTML file per translated slug and prefixed
// locale. Content ships with each build, so `dynamicParams` is off — it must be
// a static literal, and `output: "export"` forbids `true` — and an
// untranslated slug 404s.
export const dynamicParams = false;
export const revalidate = false;

export function generateStaticParams(): { locale: string; slug: string }[] {
  return PREFIXED_LOCALES.flatMap((locale) =>
    getTranslatedSlugs().map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: ZhArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!hasTranslation(slug)) {
    return {};
  }
  const mod = await importArticleModule(slug, "zh-TW").catch(() => null);
  if (!mod) {
    return {};
  }
  const url = `${env.NEXT_PUBLIC_DOMAIN_NAME}/zh-TW/articles/${slug}`;
  const enUrl = `${env.NEXT_PUBLIC_DOMAIN_NAME}/articles/${slug}`;
  // The share image is the EN hero; the translation carries no art of its own.
  const en = await importArticleModule(slug, "en").catch(() => null);
  const ogImage = en && {
    url: en.heroImage.src,
    width: en.heroImage.width,
    height: en.heroImage.height,
    alt: en.meta.imageAlt,
  };
  return {
    title: mod.meta.title,
    description: mod.meta.description,
    alternates: {
      canonical: url,
      types: feedAlternates,
      languages: { en: enUrl, "zh-TW": url, "x-default": enUrl },
    },
    openGraph: {
      ...baseOpenGraph,
      type: "article",
      url,
      locale: "zh_TW",
      alternateLocale: "en_GB",
      title: mod.meta.title,
      description: mod.meta.description,
      ...(ogImage && { images: [ogImage] }),
    },
    twitter: {
      ...baseTwitter,
      title: mod.meta.title,
      description: mod.meta.description,
      ...(ogImage && { images: [ogImage.url] }),
    },
  };
}

export default async function ZhArticlePage({ params }: ZhArticlePageProps) {
  const { slug } = await params;
  if (!hasTranslation(slug)) {
    notFound();
  }
  return renderArticle({ slug, locale: "zh-TW" });
}
