import type { ArticleMeta } from "@/app/[locale]/(blog)/articles/service";
import { env } from "@/config/env";
import type { Locale } from "@/i18n/routing";

interface ArticleJsonLdProps {
  locale: Locale;
  meta: ArticleMeta;
  slug: string;
  translationHref?: string;
}

export function ArticleJsonLd({
  locale,
  meta,
  slug,
  translationHref,
}: ArticleJsonLdProps) {
  const baseUrl = env.NEXT_PUBLIC_DOMAIN_NAME;
  const url =
    locale === "zh-TW"
      ? `${baseUrl}/zh-TW/articles/${slug}`
      : `${baseUrl}/articles/${slug}`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    inLanguage: locale === "zh-TW" ? "zh-TW" : "en",
    url,
    author: {
      "@type": "Person",
      name: "Howard Tai",
      url: baseUrl,
    },
    publisher: {
      "@type": "Person",
      name: "Howard Tai",
      url: baseUrl,
    },
  };

  if (translationHref) {
    const altUrl = `${baseUrl}${translationHref}`;
    if (locale === "zh-TW") {
      jsonLd.translationOfWork = {
        "@type": "Article",
        inLanguage: "en",
        url: altUrl,
      };
    } else {
      jsonLd.workTranslation = {
        "@type": "Article",
        inLanguage: "zh-TW",
        url: altUrl,
      };
    }
  }

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires inline script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      type="application/ld+json"
    />
  );
}
