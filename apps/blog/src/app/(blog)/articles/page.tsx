import { Card, CardCta, CardDescription, CardEyebrow, CardTitle } from "@/components/template/Card"
import { SimpleLayout } from "@/components/template/SimpleLayout"
import { formatDate } from "@/utils/time"

import { ArticleEntity, getArticles } from "./service"

function Article({ slug, meta }: Omit<ArticleEntity, "component">) {
  return (
    <article className="md:grid md:grid-cols-4 md:items-baseline">
      <Card className="md:col-span-3">
        <CardTitle href={`/articles/${slug}`}>{meta.title}</CardTitle>
        <CardEyebrow as="time" dateTime={meta.date} className="md:hidden" decorate>
          {formatDate(meta.date)}
        </CardEyebrow>
        <CardDescription>{meta.description}</CardDescription>
        <CardCta>Read article</CardCta>
      </Card>
      <CardEyebrow as="time" dateTime={meta.date} className="mt-1 hidden md:block">
        {formatDate(meta.date)}
      </CardEyebrow>
    </article>
  )
}

export default async function ArticlesIndex() {
  const articles = await getArticles()

  return (
    <SimpleLayout
      title="Writing on explorations of software programming."
      intro="All of my long-form thoughts on programming, product design, diving on technologies and more, collected in chronological order."
    >
      <div className="md:border-l md:border-base-200 md:pl-6">
        <div className="flex max-w-3xl flex-col space-y-16">
          {articles.map((article) => (
            <Article key={article.slug} slug={article.slug} meta={article.meta} />
          ))}
        </div>
      </div>
    </SimpleLayout>
  )
}
