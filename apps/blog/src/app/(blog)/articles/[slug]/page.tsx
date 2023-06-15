import type { Metadata } from "next"
import { FC } from "react"

import { ArticleMeta, getArticles } from "../service"
import { ArticleLayout } from "./ArticleLayout"

interface ArticlePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params: { slug } }: ArticlePageProps): Promise<Metadata> {
  const meta = await import(`./(docs)/${slug}.mdx`).then((file) => file.meta)

  return {
    title: meta.title,
    description: meta.description,
  }
}

export default async function ArticlePage({ params: { slug } }: ArticlePageProps) {
  const mod = (await import(`./(docs)/${slug}.mdx`)) as {
    meta: ArticleMeta
    default: FC
  }

  return (
    <ArticleLayout meta={mod.meta}>
      <mod.default />
    </ArticleLayout>
  )
}

export async function generateStaticParams() {
  const articles = await getArticles()

  return articles.map((article) => ({
    params: {
      slug: article.slug,
    },
  }))
}
