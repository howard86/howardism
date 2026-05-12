import ArticleCard from "./articles/ArticleCard";
import type { ArticleEntity, Normalise } from "./articles/service";

interface FeaturedArticlesProps {
  articles: Normalise<ArticleEntity>;
}

export function FeaturedArticles({ articles }: FeaturedArticlesProps) {
  return (
    <div className="flex flex-col gap-16">
      {articles.ids.map((slug) => {
        const article = articles.entities[slug];
        return (
          article && <ArticleCard key={slug} meta={article.meta} slug={slug} />
        );
      })}
    </div>
  );
}
