import { join } from "node:path"

import glob from "fast-glob"
import { cache, type FC } from "react"

type Normalise<T> = {
  ids: string[]
  entities: Record<string, T>
}

export type ArticleEntity = {
  position: number
  slug: string
  meta: ArticleMeta
  component: FC
}

export interface ArticleMeta {
  title: string
  description: string
  date: string
}

const getRawArticles = async (): Promise<Normalise<ArticleEntity>> => {
  const filenames = await glob("*.mdx", {
    cwd: join(process.cwd(), "src", "app", "(blog)", "articles", "[slug]", "(docs)"),
  })

  const files = await Promise.all(
    filenames.map(async (filename) => {
      const mod = (await import(`./[slug]/(docs)/${filename}`)) as {
        meta: ArticleMeta
        default: FC
      }

      return {
        slug: filename.replace(/.mdx$/, ""),
        meta: mod.meta,
        component: mod.default,
      }
    })
  )

  files.sort((a, b) => new Date(b.meta.date).valueOf() - new Date(a.meta.date).valueOf())

  const results: Normalise<ArticleEntity> = {
    ids: [],
    entities: {},
  }

  files.forEach((file, index) => {
    results.ids.push(file.slug)
    results.entities[file.slug] = {
      position: index,
      ...file,
    }
  })

  return results
}

export const getArticles = cache(getRawArticles)
