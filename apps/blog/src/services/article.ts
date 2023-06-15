import { join } from "node:path"

import glob from "fast-glob"
import { FC } from "react"

import type { ArticleMeta } from "@/components/template/ArticleLayout"

export type ArticleEntity = {
  slug: string
  meta: ArticleMeta
  component?: FC<{ isRssFeed?: boolean }>
}

export async function getAllArticles(includeComponent = false) {
  const filenames = await glob("*.mdx", {
    cwd: join(process.cwd(), "src", "app", "(blog)", "articles", "[slug]", "(docs)"),
  })

  const articles = await Promise.all(
    filenames.map(async (articleFilename) => {
      const { meta, default: component } = await import(
        `../app/(blog)/articles/[slug]/(docs)/${articleFilename}`
      )

      return {
        slug: articleFilename.replace(/(\/index)?\.mdx$/, ""),
        meta,
        component: includeComponent ? component : undefined,
      } as ArticleEntity
    })
  )

  return articles.sort((a, b) => new Date(b.meta.date).valueOf() - new Date(a.meta.date).valueOf())
}
