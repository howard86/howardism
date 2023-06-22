import { Feed } from "feed"
import { cache } from "react"

import { getArticles } from "../(blog)/articles/service"
import { AUTHOR_EMAIL, AUTHOR_NAME, SITE_DESCRIPTION, SITE_NAME } from "../constants"

const siteUrl = process.env.NEXT_PUBLIC_DOMAIN_NAME

async function generateRawFeed(): Promise<Feed> {
  if (!siteUrl) throw new Error("Failed to get env=NEXT_PUBLIC_DOMAIN_NAME")

  const articles = await getArticles()

  const author = {
    name: AUTHOR_NAME,
    email: AUTHOR_EMAIL,
  }

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
  })

  for (const articleSlug of articles.ids) {
    const article = articles.entities[articleSlug]

    const url = `${siteUrl}/articles/${articleSlug}`

    feed.addItem({
      title: article.meta.title,
      id: url,
      link: url,
      description: article.meta.description,
      author: [author],
      contributor: [author],
      date: new Date(article.meta.date),
    })
  }

  return feed
}

export const generateFeed = cache(generateRawFeed)
