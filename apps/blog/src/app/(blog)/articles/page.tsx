import {
  Card,
  CardCta,
  CardDescription,
  CardEyebrow,
  CardTitle,
} from "@/app/(common)/Card";
import { SimpleLayout } from "@/app/(common)/SimpleLayout";
import { formatDate } from "@/utils/time";

import { type ArticleEntity, getArticles } from "./service";

function Article({
  slug,
  meta,
}: Omit<ArticleEntity, "component" | "position">) {
  return (
    <article className="md:grid md:grid-cols-4 md:items-baseline">
      <Card className="md:col-span-3">
        <CardTitle href={`/articles/${slug}`}>{meta.title}</CardTitle>
        <CardEyebrow
          as="time"
          className="md:hidden"
          dateTime={meta.date}
          decorate
        >
          {formatDate(meta.date)}
        </CardEyebrow>
        <CardDescription>{meta.description}</CardDescription>
        <CardCta>Read article</CardCta>
      </Card>
      <CardEyebrow
        as="time"
        className="mt-1 hidden md:block"
        dateTime={meta.date}
      >
        {formatDate(meta.date)}
      </CardEyebrow>
    </article>
  );
}

export default async function ArticlesIndex() {
  const articles = await getArticles();

  return (
    <SimpleLayout
      intro="All of my long-form thoughts on programming, product design, diving on technologies and more, collected in chronological order."
      title="Writing on explorations of software programming."
    >
      <div className="md:border-border md:border-l md:pl-6">
        <div className="flex max-w-3xl flex-col space-y-16">
          {articles.ids.map((slug) => {
            const article = articles.entities[slug];

            return (
              article && <Article key={slug} meta={article.meta} slug={slug} />
            );
          })}
        </div>
      </div>
    </SimpleLayout>
  );
}
