import type { MetadataRoute } from "next";

import { getVisibleArticles } from "@/app/(blog)/articles/service";
import { env } from "@/config/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const visible = await getVisibleArticles();
  const baseUrl = env.NEXT_PUBLIC_DOMAIN_NAME;

  const articleEntries: MetadataRoute.Sitemap = visible.ids.flatMap((slug) => {
    const entity = visible.entities[slug];
    if (!entity) {
      return [];
    }
    return [
      {
        url: `${baseUrl}/articles/${slug}`,
        lastModified: new Date(entity.meta.date),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      },
    ];
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...articleEntries,
  ];
}
