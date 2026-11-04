import "server-only";

import { HERO_VARIANT_WIDTHS } from "@howardism/article-contract/hero";
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
 * resolving through each file's `../assets/<slug>.webp` export.
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

/**
 * The hero's downscaled `<slug>-<width>.webp` twins, smallest first. The
 * template literal makes the bundler emit every asset matching it, as with the
 * MDX imports above; a release without the variants just yields none, and the
 * hero renders at full size alone.
 */
async function importHeroVariants(slug: string): Promise<StaticImageData[]> {
  const variants = await Promise.all(
    HERO_VARIANT_WIDTHS.map((width) =>
      import(`@/content/assets/${slug}-${width}.webp`).then(
        (mod: { default: StaticImageData }) => mod.default,
        () => null
      )
    )
  );
  return variants.filter((variant) => variant !== null);
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
  // A missing zh-TW MDX (translations.json ahead of committed files) should 404,
  // not throw a module-not-found 500. The en path is already guarded by articleExists above.
  const [mod, heroVariants] = await Promise.all([
    importArticleModule(slug, locale).catch(() => notFound()),
    importHeroVariants(slug),
  ]);
  if (locale === "zh-TW") {
    return (
      <ArticleLayout
        headings={mod.headings}
        heroImage={mod.heroImage}
        heroVariants={heroVariants}
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
      heroVariants={heroVariants}
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
