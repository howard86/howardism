import { mkdir, writeFile } from "fs/promises"

import React from "react"
import { Feed } from "feed"

import DEFAULT_SEO from "../constants/seo"

import { getAllArticles } from "./article"

const siteUrl = process.env.NEXT_PUBLIC_DOMAIN_NAME

const author = {
  name: "Howard Tai",
  email: "howard@howardism.dev",
}

export async function generateRssFeed() {
  if (!siteUrl) throw new Error("Failed to get env=NEXT_PUBLIC_DOMAIN_NAME")

  const { renderToStaticMarkup } = await import("react-dom/server")

  const articles = await getAllArticles(true)

  const feed = new Feed({
    title: author.name,
    description: DEFAULT_SEO.description,
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

  for (const article of articles) {
    if (!article.component) return

    const url = `${siteUrl}/articles/${article.slug}`
    const html = renderToStaticMarkup(<article.component isRssFeed />)

    feed.addItem({
      title: article.meta.title,
      id: url,
      link: url,
      description: article.meta.description,
      content: html,
      author: [author],
      contributor: [author],
      date: new Date(article.meta.date),
    })
  }

  await mkdir("./public/rss", { recursive: true })
  await Promise.all([
    writeFile("./public/rss/feed.xml", feed.rss2(), "utf8"),
    writeFile("./public/rss/feed.json", feed.json1(), "utf8"),
  ])
}
