import { describe, expect, it } from "bun:test";

import { generateMetadata as zhArticleMetadata } from "@/app/(blog)/[locale]/articles/[slug]/page";
import { metadata as zhIndexMetadata } from "@/app/(blog)/[locale]/articles/page";
import { generateMetadata as articleMetadata } from "@/app/(blog)/articles/[slug]/page";
import { generateMetadata as domainMetadata } from "@/app/(blog)/articles/domain/[domain]/page";
import { DOMAIN_ORDER } from "@/app/(blog)/articles/domain-meta";
import { metadata as articlesIndexMetadata } from "@/app/(blog)/articles/page";
import { getTranslatedSlugs } from "@/app/(blog)/articles/service";
import { feedAlternates } from "@/app/(blog)/shared-metadata";
import { SITE_NAME, TWITTER_USERNAME } from "@/app/constants";
import { env } from "@/config/env";

// Next merges `openGraph`, `twitter` and `alternates` shallowly, so each of
// these pages must carry the site-wide fields itself. These pin that.

const base = env.NEXT_PUBLIC_DOMAIN_NAME;
const [slug] = getTranslatedSlugs();

function expectSiteWide(metadata: {
  alternates?: unknown;
  openGraph?: unknown;
  twitter?: unknown;
}) {
  expect(metadata.openGraph).toMatchObject({ siteName: SITE_NAME });
  expect(metadata.twitter).toMatchObject({
    card: "summary_large_image",
    site: TWITTER_USERNAME,
  });
  expect(metadata.alternates).toMatchObject({ types: feedAlternates });
}

describe("page metadata", () => {
  it("keeps site-wide fields on /articles and pairs it with zh-TW", () => {
    expect(articlesIndexMetadata.title).toBe("Articles");
    expectSiteWide(articlesIndexMetadata);
    expect(articlesIndexMetadata.alternates?.languages).toEqual({
      en: `${base}/articles`,
      "zh-TW": `${base}/zh-TW/articles`,
      "x-default": `${base}/articles`,
    });
    expectSiteWide(zhIndexMetadata);
  });

  it("keeps site-wide fields on domain pages without double branding", async () => {
    const [domain] = DOMAIN_ORDER;
    const metadata = await domainMetadata({
      params: Promise.resolve({ domain }),
    });
    expectSiteWide(metadata);
    expect(String(metadata.title)).not.toContain(SITE_NAME);
  });

  it("pairs a translated article with its zh-TW page in both directions", async () => {
    expect(slug).toBeString();
    const en = await articleMetadata({ params: Promise.resolve({ slug }) });
    const zh = await zhArticleMetadata({
      params: Promise.resolve({ locale: "zh-TW", slug }),
    });
    const languages = {
      en: `${base}/articles/${slug}`,
      "zh-TW": `${base}/zh-TW/articles/${slug}`,
      "x-default": `${base}/articles/${slug}`,
    };

    expectSiteWide(en);
    expectSiteWide(zh);
    expect(en.alternates?.languages).toEqual(languages);
    expect(zh.alternates?.languages).toEqual(languages);
    expect(en.openGraph).toMatchObject({
      type: "article",
      alternateLocale: "zh_TW",
    });
    expect(zh.openGraph).toMatchObject({
      locale: "zh_TW",
      alternateLocale: "en_GB",
    });
  });

  it("gives the zh-TW article the EN hero as its share image", async () => {
    const en = await articleMetadata({ params: Promise.resolve({ slug }) });
    const zh = await zhArticleMetadata({
      params: Promise.resolve({ locale: "zh-TW", slug }),
    });
    const enImages = (en.openGraph as { images: { url: string }[] }).images;
    const zhImages = (zh.openGraph as { images: { url: string }[] }).images;
    expect(zhImages[0]?.url).toBe(enImages[0]?.url);
  });
});
