import { formatDateShort } from "@/utils/time";

import ArticleCard from "./articles/article-card";
import type { ArticleEntity, Normalise } from "./articles/service";

interface FeaturedArticlesProps {
  articles: Normalise<ArticleEntity>;
}

interface DateBatch {
  articles: ArticleEntity[];
  date: string;
}

function groupByDate(articles: ArticleEntity[]): DateBatch[] {
  const batches: DateBatch[] = [];
  for (const article of articles) {
    const last = batches.at(-1);
    if (last && last.date === article.meta.date) {
      last.articles.push(article);
    } else {
      batches.push({ date: article.meta.date, articles: [article] });
    }
  }
  return batches;
}

export function FeaturedArticles({ articles }: FeaturedArticlesProps) {
  const entities: ArticleEntity[] = [];
  for (const id of articles.ids) {
    const entity = articles.entities[id];
    if (entity) {
      entities.push(entity);
    }
  }
  const batches = groupByDate(entities);

  return (
    <div className="flex flex-col gap-14">
      {batches.map((batch) => (
        <section key={batch.date}>
          <header className="mb-8 flex items-baseline gap-3 border-foreground border-b border-dashed pb-2 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.18em]">
            <time dateTime={batch.date}>
              {formatDateShort(batch.date).toUpperCase()}
            </time>
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
            <span>
              {batch.articles.length}{" "}
              {batch.articles.length === 1 ? "piece" : "pieces"}
            </span>
          </header>
          <div className="flex flex-col gap-16">
            {batch.articles.map((article) => (
              <ArticleCard
                key={article.slug}
                meta={article.meta}
                slug={article.slug}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
