import { join } from "node:path"

import glob from "fast-glob"
import { cache } from "react"

export type ArticleEntity = {
  slug: string
  meta: ArticleMeta
}

export interface ArticleMeta {
  title: string
  description: string
  date: string
}

const getRawArticles = async () => {
  const filenames = await glob("*.mdx", {
    cwd: join(process.cwd(), "src", "app", "(blog)", "articles", "[slug]", "(docs)"),
  })

  const results = await Promise.all(
    filenames.map(async (filename) => {
      const { meta } = (await import(`./[slug]/(docs)/${filename}`)) as {
        meta: ArticleMeta
      }

      return {
        slug: filename.replace(/.mdx$/, ""),
        meta,
      }
    })
  )

  return results.sort((a, b) => new Date(b.meta.date).valueOf() - new Date(a.meta.date).valueOf())
}

export const getArticles = cache(getRawArticles)
