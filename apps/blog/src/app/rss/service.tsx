import "server-only";

import { Feed } from "feed";

import { env } from "@/config/env";
import { getVisibleArticles, once } from "../(blog)/articles/service";
import {
  AUTHOR_EMAIL,
  AUTHOR_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "../constants";

const siteUrl = env.NEXT_PUBLIC_DOMAIN_NAME;

// `once`, not React's `cache`: feed.xml and feed.json are separate route
// handlers, so a per-render memo builds the same feed twice per build.
export const generateFeed = once(async (): Promise<Feed> => {
  const articles = await getVisibleArticles();

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
