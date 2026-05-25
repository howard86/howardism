import type { MetadataRoute } from "next";

import {
  getTranslatedSlugs,
  getVisibleArticles,
} from "@/app/[locale]/(blog)/articles/service";
import { TAG_SECTIONS } from "@/app/[locale]/(blog)/articles/tag-sections";
import { env } from "@/config/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const visible = await getVisibleArticles();
  const baseUrl = env.NEXT_PUBLIC_DOMAIN_NAME;
  const translatedSlugs = new Set(getTranslatedSlugs());

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: { en: baseUrl, "zh-TW": `${baseUrl}/zh-TW` },
      },
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          en: `${baseUrl}/articles`,
          "zh-TW": `${baseUrl}/zh-TW/articles`,
        },
      },
    },
  ];

  const tagEntries: MetadataRoute.Sitemap = TAG_SECTIONS.map((section) => ({
    url: `${baseUrl}/articles/tag/${section.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  const articleEntries: MetadataRoute.Sitemap = visible.ids.flatMap((slug) => {
    const entity = visible.entities[slug];
    if (!entity) {
      return [];
    }
    const enUrl = `${baseUrl}/articles/${slug}`;
    const hasZh = translatedSlugs.has(slug);
    return [
      {
        url: enUrl,
        lastModified: new Date(entity.meta.date),
        changeFrequency: "monthly" as const,
        priority: 0.8,
        ...(hasZh && {
          alternates: {
            languages: {
              en: enUrl,
              "zh-TW": `${baseUrl}/zh-TW/articles/${slug}`,
            },
          },
        }),
      },
    ];
  });

  // zh-TW article entries
  const zhArticleEntries: MetadataRoute.Sitemap = [...translatedSlugs].flatMap(
    (slug) => {
      const entity = visible.entities[slug];
      if (!entity) {
        return [];
      }
      return [
        {
          url: `${baseUrl}/zh-TW/articles/${slug}`,
          lastModified: new Date(entity.meta.date),
          changeFrequency: "monthly" as const,
          priority: 0.7,
          alternates: {
            languages: {
              en: `${baseUrl}/articles/${slug}`,
              "zh-TW": `${baseUrl}/zh-TW/articles/${slug}`,
            },
          },
        },
      ];
    }
  );

  return [
    ...staticEntries,
    ...tagEntries,
    ...articleEntries,
    ...zhArticleEntries,
  ];
}
