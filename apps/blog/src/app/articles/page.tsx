import { Card, CardCta, CardDescription, CardEyebrow, CardTitle } from "@/components/template/Card"
import { SimpleLayout } from "@/components/template/SimpleLayout"
import { ArticleEntity, getAllArticles } from "@/services/article"
import { formatDate } from "@/utils/time"

type ArticleProps = Omit<ArticleEntity, "component">

function Article({ slug, meta }: ArticleProps) {
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
  const articles = await getAllArticles()

  return (
    <SimpleLayout
      title="Writing on software design, company building, and the aerospace industry."
      intro="All of my long-form thoughts on programming, leadership, product design, and more, collected in chronological order."
    >
      <div className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
        <div className="flex max-w-3xl flex-col space-y-16">
          {articles.map((article) => (
            <Article key={article.slug} slug={article.slug} meta={article.meta} />
          ))}
        </div>
      </div>
    </SimpleLayout>
  )
}
