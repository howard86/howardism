import "server-only";

import type { StaticImageData } from "next/image";
import { notFound } from "next/navigation";
import type { FC } from "react";

import { ArticleLayout } from "./[slug]/article-layout";
import {
  type ArticleHeading,
  type ArticleMeta,
  articleExists,
  getNavigableTagSet,
  getSiblings,
  getTranslatedSlugs,
  hasTranslation,
  isTranslationStale,
  type Locale,
} from "./service";

export interface ArticleModule {
  default: FC;
  headings: ArticleHeading[];
  heroImage: StaticImageData;
  meta: ArticleMeta;
}

/**
 * Locale-aware MDX module import. The two distinct string literals make webpack
 * build one require-context per content directory — the precompiled modules are
 * loaded on demand, so no runtime MDX compiler is needed and hero images keep
 * resolving through each file's `../assets/<slug>.png` export.
 */
export function importArticleModule(
  slug: string,
  locale: Locale
): Promise<ArticleModule> {
  if (locale === "zh-TW") {
    return import(
      `@/content/articles-zh-TW/${slug}.mdx`
    ) as Promise<ArticleModule>;
  }
  return import(`@/content/articles/${slug}.mdx`) as Promise<ArticleModule>;
}

interface RenderArticleArgs {
  locale: Locale;
  slug: string;
}

/**
 * Shared reader render for both the unprefixed `en` route and `/zh-TW`. For
 * zh-TW we skip the English-graph siblings/tags (their links are English) and
 * point the switcher at the English twin; for `en` we link to the translation
 * only when one exists.
 */
export async function renderArticle({ slug, locale }: RenderArticleArgs) {
  // Unknown en slug → 404 (not a 500 from a rejected MDX import). The zh-TW
  // route is already gated by hasTranslation() before reaching here.
  if (locale === "en" && !(await articleExists(slug))) {
    notFound();
  }
  const mod = await importArticleModule(slug, locale);
  if (locale === "zh-TW") {
    return (
      <ArticleLayout
        headings={mod.headings}
        heroImage={mod.heroImage}
        isStale={isTranslationStale(slug)}
        locale="zh-TW"
        meta={mod.meta}
        slug={slug}
        translationHref={`/articles/${slug}`}
      >
        <mod.default />
      </ArticleLayout>
    );
  }
  const [siblings, navigable] = await Promise.all([
    getSiblings(slug),
    getNavigableTagSet(),
  ]);
  return (
    <ArticleLayout
      headings={mod.headings}
      heroImage={mod.heroImage}
      locale="en"
      meta={mod.meta}
      navigable={navigable}
      siblings={siblings}
      slug={slug}
      translationHref={
        hasTranslation(slug) ? `/zh-TW/articles/${slug}` : undefined
      }
    >
      <mod.default />
    </ArticleLayout>
  );
}

export interface LocalizedArticleLink {
  date: string;
  description: string;
  slug: string;
  title: string;
}

/**
 * Translated-article links carrying their zh-TW titles, newest-first — backs
 * the `/zh-TW/articles` index. Loads each translated module's frontmatter only
 * (precompiled, cheap).
 */
export async function getTranslatedArticleLinks(): Promise<
  LocalizedArticleLink[]
> {
  const links = await Promise.all(
    getTranslatedSlugs().map(async (slug) => {
      const mod = await importArticleModule(slug, "zh-TW");
      return {
        slug,
        title: mod.meta.title,
        description: mod.meta.description,
        date: mod.meta.date,
      };
    })
  );
  return links.sort(
    (a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf()
  );
}
