import type { Metadata } from "next"

import { getArticles } from "../service"
import { ArticleLayout } from "./ArticleLayout"

interface ArticlePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params: { slug } }: ArticlePageProps): Promise<Metadata> {
  const articles = await getArticles()
  const { meta } = articles.entities[slug]

  return {
    title: meta.title,
    description: meta.description,
  }
}

export default async function ArticlePage({ params: { slug } }: ArticlePageProps) {
  const articles = await getArticles()
  const article = articles.entities[slug]

  return (
    <ArticleLayout
      meta={article.meta}
      previousSlug={articles.ids[article.position + 1]}
      nextSlug={articles.ids[article.position - 1]}
    >
      <article.component />
    </ArticleLayout>
  )
}

export async function generateStaticParams() {
  const articles = await getArticles()

  return articles.ids.map((slug) => ({
    params: { slug },
  }))
}
