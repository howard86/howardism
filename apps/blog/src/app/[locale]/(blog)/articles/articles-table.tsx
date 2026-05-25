import { InternalLink } from "@/components/internal-link";
import { formatDateShort } from "@/utils/time";

import type { ArticleEntity } from "./service";

interface ArticlesTableProps {
  articles: ArticleEntity[];
  /**
   * Caption rendered for screen readers describing the rows. Defaults to a
   * generic article-listing caption.
   */
  srCaption?: string;
  title?: string;
}

const DEFAULT_SR_CAPTION = "List of articles, sorted by date, newest first.";

export function ArticlesTable({
  articles,
  srCaption = DEFAULT_SR_CAPTION,
  title,
}: ArticlesTableProps) {
  return (
    <section>
      {title ? (
        <header className="mb-4 flex items-baseline justify-between border-foreground border-b-[1.5px] pb-2.5">
          <h2 className="m-0 font-display font-medium text-[26px] text-foreground tracking-[-0.02em]">
            {title}
          </h2>
          <span className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
            {articles.length} {articles.length === 1 ? "piece" : "pieces"}
          </span>
        </header>
      ) : null}
      <table className="w-full border-collapse">
        <caption className="sr-only">{srCaption}</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Summary</th>
            <th scope="col">Date</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr
              className="border-border border-b align-baseline last:border-b-0"
              key={article.slug}
            >
              <td className="w-[34%] py-3.5 pr-6 align-baseline">
                <InternalLink
                  className="font-display font-medium text-[16px] text-foreground no-underline transition-colors hover:text-brand"
                  href={`/articles/${article.slug}`}
                  previewMeta={article.meta}
                >
                  {article.meta.title}
                </InternalLink>
              </td>
              <td className="py-3.5 pr-6 align-baseline font-body text-[14px] text-muted-foreground leading-[1.45]">
                {article.meta.description}
              </td>
              <td className="w-[110px] whitespace-nowrap py-3.5 text-right align-baseline font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
                <time dateTime={article.meta.date}>
                  {formatDateShort(article.meta.date)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
