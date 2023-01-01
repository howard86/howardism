import { FC } from "react"
import glob from "fast-glob"
import { join } from "node:path"

import type { ArticleMeta } from "@/components/template/ArticleLayout"

export type ArticleEntity = {
  slug: string
  meta: ArticleMeta
  component?: FC<{ isRssFeed?: boolean }>
}

export async function getAllArticles(includeComponent = false) {
  const articleFilenames = await glob(["*.mdx", "*/index.mdx"], {
    cwd: join(process.cwd(), "src/pages/articles"),
  })

  const articles = await Promise.all(
    articleFilenames.map(async (articleFilename) => {
      const { meta, default: component } = await import(`../pages/articles/${articleFilename}`)

      return {
        slug: articleFilename.replace(/(\/index)?\.mdx$/, ""),
        meta,
        component: includeComponent ? component : undefined,
      } as ArticleEntity
    })
  )

  return articles.sort((a, b) => new Date(b.meta.date).valueOf() - new Date(a.meta.date).valueOf())
}
