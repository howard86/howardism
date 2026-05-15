import "server-only";

import { Feed } from "feed";
import { cache } from "react";

import { env } from "@/config/env";
import { getVisibleArticles } from "../(blog)/articles/service";
import {
  AUTHOR_EMAIL,
  AUTHOR_NAME,
  SITE_NAME,
  SITE_TAGLINE,
} from "../constants";

const siteUrl = env.NEXT_PUBLIC_DOMAIN_NAME;

export const generateFeed = cache(async (): Promise<Feed> => {
  const articles = await getVisibleArticles();

  const author = {
    name: AUTHOR_NAME,
    email: AUTHOR_EMAIL,
  };

  const feed = new Feed({
    title: SITE_NAME,
    description: SITE_TAGLINE,
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

    if (!article) {
      continue;
    }

    const url = `${siteUrl}/articles/${slug}`;

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

  return feed;
});
