import { describe, expect, it } from "bun:test";

import { DOMAIN_ORDER } from "@/app/(blog)/articles/domain-meta";
import {
  getTranslatedSlugs,
  getVisibleArticles,
} from "@/app/(blog)/articles/service";
import { TAG_SECTIONS } from "@/app/(blog)/articles/tag-sections";
import sitemap from "@/app/sitemap";
import { env } from "@/config/env";

describe("sitemap", () => {
  it("includes an entry for every /articles/tag section page", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    for (const section of TAG_SECTIONS) {
      expect(
        urls.some((url) => url.endsWith(`/articles/tag/${section.slug}`))
      ).toBe(true);
    }
  });

  it("still includes the home and articles index entries", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls.some((url) => url.endsWith("/articles"))).toBe(true);
    expect(urls.length).toBeGreaterThanOrEqual(2 + TAG_SECTIONS.length);
  });

  it("lists domain pages and /questions, without changefreq or priority", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls.some((url) => url.endsWith("/questions"))).toBe(true);
    for (const domain of DOMAIN_ORDER) {
      expect(
        urls.some((url) => url.endsWith(`/articles/domain/${domain}`))
      ).toBe(true);
    }
    for (const entry of entries) {
      expect(entry.changeFrequency).toBeUndefined();
      expect(entry.priority).toBeUndefined();
    }
  });

  it("pairs each translated article with its zh-TW URL via alternates", async () => {
    const entries = await sitemap();
    const visible = await getVisibleArticles();
    const slugs = getTranslatedSlugs().filter((slug) => visible.entities[slug]);
    const base = env.NEXT_PUBLIC_DOMAIN_NAME;

    expect(entries.some((e) => e.url === `${base}/zh-TW/articles`)).toBe(true);
    for (const slug of slugs) {
      const en = `${base}/articles/${slug}`;
      const zh = `${base}/zh-TW/articles/${slug}`;
      const languages = { en, "zh-TW": zh, "x-default": en };
      expect(entries.find((e) => e.url === en)?.alternates?.languages).toEqual(
        languages
      );
      expect(entries.find((e) => e.url === zh)?.alternates?.languages).toEqual(
        languages
      );
    }
  });

  it("dates index pages by the newest article, not the build time", async () => {
    const entries = await sitemap();
    const visible = await getVisibleArticles();
    const newest = Math.max(
      ...visible.ids.map((id) => visible.entities[id]?.dateMs ?? 0)
    );
    const index = entries.find((e) => e.url.endsWith("/articles"));

    expect(new Date(index?.lastModified as Date).getTime()).toBe(newest);
  });
});
