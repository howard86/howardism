import "server-only";

import { Feed } from "feed";
import { cache } from "react";

import { env } from "@/config/env";
import { getArticles } from "../(blog)/articles/service";
import {
  AUTHOR_EMAIL,
  AUTHOR_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "../constants";

// NEXT_PUBLIC_DOMAIN_NAME is optional; fall back to the same default Next.js
// uses for `metadataBase` so a build without it still produces a valid feed.
const siteUrl = env.NEXT_PUBLIC_DOMAIN_NAME ?? "http://localhost:3000";

export const generateFeed = cache(async (): Promise<Feed> => {
  const articles = await getArticles();

  const author = {
    name: AUTHOR_NAME,
    email: AUTHOR_EMAIL,
  };

  const feed = new Feed({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    author,
    id: siteUrl,
    link: siteUrl,
    image: `${siteUrl}/favicon.ico`,
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    feedLinks: {
      rss2: `${siteUrl}/rss/feed.xml`,
      json: `${siteUrl}/rss/feed.json`,
    },
  });

  for (const slug of articles.ids) {
    const article = articles.entities[slug];

    const url = `${siteUrl}/articles/${slug}`;

    if (article) {
      feed.addItem({
        title: article.meta.title,
        id: url,
        link: url,
        description: article.meta.description,
        author: [author],
        contributor: [author],
        date: new Date(article.meta.date),
      });
    }
  }

  return feed;
});
