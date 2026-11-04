import { AUTHOR_NAME } from "@/app/constants";

type JsonLd = Record<string, unknown>;

type ArticleLocale = "en" | "zh-TW";

const SCHEMA_CONTEXT = "https://schema.org";

interface HeroImageRef {
  src: string;
}

interface ArticleStructuredDataArgs {
  /** Display label of `domain`, when the article has one. */
  domainLabel?: string;
  /** Hero variants (smallest first) followed by the full-size original. */
  images: HeroImageRef[];
  locale: ArticleLocale;
  meta: {
    date: string;
    description: string;
    tags?: string[];
    title: string;
  };
  /** Profile URLs for `author.sameAs`; non-http(s) links are dropped. */
  profileUrls: readonly string[];
  siteName: string;
  /** Canonical origin, no trailing slash. */
  siteUrl: string;
  slug: string;
}

const articlePath = (slug: string, locale: ArticleLocale) =>
  locale === "zh-TW" ? `/zh-TW/articles/${slug}` : `/articles/${slug}`;

/** Origin without a trailing slash, so `${origin}/` is always well-formed. */
const originOf = (siteUrl: string) => new URL(siteUrl).origin;

const absolute = (siteUrl: string, path: string) =>
  new URL(path, siteUrl).toString();

/** schema.org `BlogPosting` mirroring what the article page shows and canonicalises. */
export function buildBlogPosting({
  domainLabel,
  images,
  locale,
  meta,
  profileUrls,
  siteName,
  siteUrl: rawSiteUrl,
  slug,
}: ArticleStructuredDataArgs): JsonLd {
  const siteUrl = originOf(rawSiteUrl);
  const url = absolute(siteUrl, articlePath(slug, locale));
  const sameAs = profileUrls.filter(
    (href) => href.startsWith("https://") || href.startsWith("http://")
  );
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    // Same instant the sitemap and feeds use for this date (UTC midnight).
    datePublished: new Date(meta.date).toISOString(),
    inLanguage: locale,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: images.map((image) => absolute(siteUrl, image.src)),
    author: {
      "@type": "Person",
      name: AUTHOR_NAME,
      url: `${siteUrl}/`,
      sameAs,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: `${siteUrl}/`,
    },
    ...(meta.tags && meta.tags.length > 0 && { keywords: meta.tags }),
    ...(domainLabel && { articleSection: domainLabel }),
    ...(locale === "zh-TW" && {
      translationOfWork: {
        "@type": "BlogPosting",
        "@id": absolute(siteUrl, articlePath(slug, "en")),
        url: absolute(siteUrl, articlePath(slug, "en")),
      },
    }),
  };
}

/** Home › Articles › Domain › Title; the domain crumb is skipped when absent. */
export function buildArticleBreadcrumbs({
  domain,
  domainLabel,
  locale,
  siteUrl: rawSiteUrl,
  slug,
  title,
}: {
  domain?: string;
  domainLabel?: string;
  locale: ArticleLocale;
  siteUrl: string;
  slug: string;
  title: string;
}): JsonLd {
  const siteUrl = originOf(rawSiteUrl);
  const trail: { name: string; item: string }[] = [
    { name: "Home", item: `${siteUrl}/` },
    {
      name: "Articles",
      item: absolute(
        siteUrl,
        locale === "zh-TW" ? "/zh-TW/articles" : "/articles"
      ),
    },
    ...(domain && domainLabel
      ? [
          {
            name: domainLabel,
            item: absolute(siteUrl, `/articles/domain/${domain}`),
          },
        ]
      : []),
    { name: title, item: absolute(siteUrl, articlePath(slug, locale)) },
  ];
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
}

/** Site-name signal for the domain-level home page. */
export function buildWebSite({
  siteName,
  siteUrl,
}: {
  siteName: string;
  siteUrl: string;
}): JsonLd {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    name: siteName,
    alternateName: siteName.toLowerCase(),
    url: `${originOf(siteUrl)}/`,
  };
}
