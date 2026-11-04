import "server-only";

import { HERO_VARIANT_WIDTHS } from "@howardism/article-contract/hero";
import type { StaticImageData } from "next/image";
import { notFound } from "next/navigation";
import type { FC } from "react";

import { SITE_NAME } from "@/app/constants";
import JsonLd from "@/components/json-ld";
import { env } from "@/config/env";
import { SOCIAL_LINKS } from "../social-links";
import { ArticleLayout } from "./[slug]/article-layout";
import { DOMAIN_META } from "./domain-meta";
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
import { buildArticleBreadcrumbs, buildBlogPosting } from "./structured-data";

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

/** BlogPosting + BreadcrumbList for the article, from the same data the page shows. */
function ArticleJsonLd({
  heroImage,
  heroVariants,
  locale,
  meta,
  slug,
}: {
  heroImage: StaticImageData;
  heroVariants: StaticImageData[];
  locale: Locale;
  meta: ArticleMeta;
  slug: string;
}) {
  const siteUrl = env.NEXT_PUBLIC_DOMAIN_NAME;
  const domainLabel = meta.domain ? DOMAIN_META[meta.domain].label : undefined;
  return (
    <>
      <JsonLd
        data={buildBlogPosting({
          domainLabel,
          images: [...heroVariants, heroImage],
          locale,
          meta,
          profileUrls: SOCIAL_LINKS.map((link) => link.href),
          siteName: SITE_NAME,
          siteUrl,
          slug,
        })}
      />
      <JsonLd
        data={buildArticleBreadcrumbs({
          domain: meta.domain,
          domainLabel,
          locale,
          siteUrl,
          slug,
          title: meta.title,
        })}
      />
    </>
  );
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
      <>
        <ArticleJsonLd
          heroImage={mod.heroImage}
          heroVariants={heroVariants}
          locale="zh-TW"
          meta={mod.meta}
          slug={slug}
        />
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
      </>
    );
  }
  const [siblings, navigable] = await Promise.all([
    getSiblings(slug),
    getNavigableTagSet(),
  ]);
  return (
    <>
      <ArticleJsonLd
        heroImage={mod.heroImage}
        heroVariants={heroVariants}
        locale="en"
        meta={mod.meta}
        slug={slug}
      />
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
    </>
  );
}
