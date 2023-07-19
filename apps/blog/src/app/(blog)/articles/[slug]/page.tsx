import type { Metadata } from "next"
import type { FC } from "react"

import { ArticleEntity, ArticleMeta, getArticles, Normalise } from "../service"
import { ArticleLayout } from "./ArticleLayout"

interface ArticlePageProps {
  params: {
    slug: string
  }
}

export const dynamic = "error"

export async function generateMetadata({ params: { slug } }: ArticlePageProps): Promise<Metadata> {
  const meta = await import(`./(docs)/${slug}.mdx`).then((file) => file.meta)

  return {
    title: meta.title,
    description: meta.description,
  }
}

const getSiblingSlug = (
  articles: Normalise<ArticleEntity>,
  slug: string,
  difference: number,
): string | undefined => {
  const selectedArticle = articles.entities[slug]

  if (!selectedArticle) return undefined

  return articles.ids[selectedArticle.position + difference]
}

export default async function ArticlePage({ params: { slug } }: ArticlePageProps) {
  const mod = (await import(`./(docs)/${slug}.mdx`)) as {
    meta: ArticleMeta
    default: FC
  }

  const articles = await getArticles()

  return (
    <ArticleLayout
      meta={mod.meta}
      previousSlug={getSiblingSlug(articles, slug, 1)}
      nextSlug={getSiblingSlug(articles, slug, -1)}
    >
      <mod.default />
    </ArticleLayout>
  )
}

export async function generateStaticParams() {
  const articles = await getArticles()

  return articles.ids.map((slug) => ({
    params: { slug },
  }))
}
