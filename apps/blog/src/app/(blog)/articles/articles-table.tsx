import Link from "next/link";

import { formatDateShort } from "@/utils/time";

import type { ArticleMeta } from "./service";

interface ArticleRow {
  meta: ArticleMeta;
  slug: string;
}

interface ArticleRowGridProps {
  articles: ArticleRow[];
  /**
   * Per-section letter that prefixes the row numerals (C01, E01, S01…).
   * Numbering counts oldest → newest, so the most-recent piece displays
   * the largest number — consistent with magazine-issue numbering.
   */
  numberPrefix?: string;
  /**
   * Caption rendered for screen readers describing the rows. Defaults to
   * a generic article-listing caption.
   */
  srCaption?: string;
}

const DEFAULT_SR_CAPTION = "List of articles, sorted by date, newest first.";

export function ArticlesTable({
  articles,
  numberPrefix,
  srCaption = DEFAULT_SR_CAPTION,
}: ArticleRowGridProps) {
  const total = articles.length;

  return (
    <ol aria-label={srCaption} className="m-0 flex list-none flex-col p-0">
      {articles.map((article, index) => {
        // Magazine numbering: oldest = 01, newest = N. The list is
        // sorted newest-first, so the oldest piece sits at index = total-1.
        const number = total - index;
        const previousDate = articles[index - 1]?.meta.date;
        const repeatsDate = previousDate === article.meta.date;

        return (
          <li
            className="group relative grid grid-cols-[64px_minmax(0,1fr)_auto] items-baseline gap-x-5 border-border border-b py-5 last:border-b-0 focus-within:bg-muted/40 hover:bg-muted/40 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:gap-x-7"
            key={article.slug}
          >
            <span
              aria-hidden="true"
              className="self-start pt-1 font-display font-normal text-[40px] text-brand tabular-nums leading-none tracking-[-0.02em] sm:text-[52px]"
            >
              {numberPrefix}
              {String(number).padStart(2, "0")}
            </span>

            <div className="flex min-w-0 flex-col gap-1.5">
              <Link
                className="font-display font-medium text-[18px] text-foreground no-underline transition-colors group-focus-within:text-brand group-hover:text-brand sm:text-[20px]"
                href={`/articles/${article.slug}`}
              >
                <span aria-hidden="true" className="absolute inset-0 z-10" />
                <span className="relative">{article.meta.title}</span>
              </Link>
              <span className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
                {repeatsDate ? (
                  <time className="sr-only" dateTime={article.meta.date}>
                    {formatDateShort(article.meta.date)}
                  </time>
                ) : (
                  <>
                    <time dateTime={article.meta.date}>
                      {formatDateShort(article.meta.date)}
                    </time>
                    <span aria-hidden="true"> — </span>
                  </>
                )}
                <span className="text-brand">{article.meta.tag}</span>
              </span>
              <p className="m-0 max-h-0 overflow-hidden font-body text-[13px] text-muted-foreground leading-[1.5] opacity-0 transition-[max-height,opacity,margin] duration-200 ease-out group-focus-within:mt-1 group-focus-within:max-h-[6rem] group-focus-within:opacity-100 group-hover:mt-1 group-hover:max-h-[6rem] group-hover:opacity-100">
                {article.meta.description}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1 self-start pt-1.5 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
              <span>
                <span aria-hidden="true">{article.meta.readingTime}′</span>
                <span className="sr-only">
                  {article.meta.readingTime} minute read
                </span>
              </span>
              <span
                aria-hidden="true"
                className="text-brand transition-transform group-focus-within:translate-x-0.5 group-hover:translate-x-0.5"
              >
                READ →
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
