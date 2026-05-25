import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "@/config/env";

import {
  importArticleModule,
  renderArticle,
} from "../../../articles/render-article";
import { hasTranslation } from "../../../articles/service";

interface ZhArticlePageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// On-demand: no build-time prerender; render the precompiled zh-TW module on
// first request, cache until redeploy.
export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams(): { locale: string; slug: string }[] {
  return [];
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
