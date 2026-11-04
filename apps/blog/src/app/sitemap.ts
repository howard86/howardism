import type { MetadataRoute } from "next";

import { DOMAIN_ORDER } from "@/app/(blog)/articles/domain-meta";
import {
  getTranslatedSlugs,
  getVisibleArticles,
} from "@/app/(blog)/articles/service";
import { TAG_SECTIONS } from "@/app/(blog)/articles/tag-sections";
import { env } from "@/config/env";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const visible = await getVisibleArticles();
  const baseUrl = env.NEXT_PUBLIC_DOMAIN_NAME;
  const translated = new Set(getTranslatedSlugs());

  // Index pages change when the newest article lands, so that date is their
  // lastmod. `new Date()` would move on every build and teach crawlers to
  // distrust the field.
  let newestMs = 0;
  for (const slug of visible.ids) {
    newestMs = Math.max(newestMs, visible.entities[slug]?.dateMs ?? 0);
  }
  const indexLastModified = newestMs > 0 ? new Date(newestMs) : undefined;

  const indexEntry = (path: string): MetadataRoute.Sitemap[number] => ({
    url: `${baseUrl}${path}`,
    lastModified: indexLastModified,
  });

  const articleEntries: MetadataRoute.Sitemap = [];
  const zhEntries: MetadataRoute.Sitemap = [];
  for (const slug of visible.ids) {
    const entity = visible.entities[slug];
    if (!entity) {
      continue;
    }
    const url = `${baseUrl}/articles/${slug}`;
    const lastModified = new Date(entity.meta.date);
    if (translated.has(slug)) {
      const zhUrl = `${baseUrl}/zh-TW/articles/${slug}`;
      const languages = { en: url, "zh-TW": zhUrl, "x-default": url };
      articleEntries.push({ url, lastModified, alternates: { languages } });
      zhEntries.push({ url: zhUrl, lastModified, alternates: { languages } });
    } else {
      articleEntries.push({ url, lastModified });
    }
  }

  return [
    indexEntry(""),
    indexEntry("/articles"),
    indexEntry("/zh-TW/articles"),
    indexEntry("/questions"),
    ...TAG_SECTIONS.map((section) =>
      indexEntry(`/articles/tag/${section.slug}`)
    ),
    ...DOMAIN_ORDER.map((domain) => indexEntry(`/articles/domain/${domain}`)),
    ...articleEntries,
    ...zhEntries,
  ];
}
