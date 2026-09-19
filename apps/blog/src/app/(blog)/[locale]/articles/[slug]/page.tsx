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

interface ZhArticlePageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Prerendered at build time, one HTML file per translated slug and prefixed
// locale. `dynamicParams` stays on so a slug translated after the deploy still
// renders on demand, and `hasTranslation` still 404s an untranslated one.
export const dynamicParams = true;
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
  return {
    title: mod.meta.title,
    description: mod.meta.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      locale: "zh_TW",
      title: mod.meta.title,
      description: mod.meta.description,
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
