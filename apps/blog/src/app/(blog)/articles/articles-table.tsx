import { IndexRow } from "./index-row";
import { kindMetaFor } from "./kind-meta";
import type { ArticleEntity } from "./service";

const NO_NAVIGABLE: ReadonlySet<string> = new Set();

interface ArticlesTableProps {
  /** Uniform numeral tint (e.g. a domain color); defaults to per-row kind. */
  accent?: string;
  articles: ArticleEntity[];
  /** Subject tags with their own page — decides which chips link. */
  navigable?: ReadonlySet<string>;
  /** Show the domain column — false on single-domain (domain) pages. */
  showDomain?: boolean;
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
  accent,
  showDomain = true,
  navigable = NO_NAVIGABLE,
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
      <ol aria-label={srCaption} className="m-0 list-none p-0">
        {articles.map((article, i) => {
          const kind = kindMetaFor(article.meta.tag);
          return (
            <IndexRow
              accent={accent ?? kind.color}
              article={article}
              first={i === 0}
              key={article.slug}
              navigable={navigable}
              ordinal={i + 1}
              prefix={kind.prefix}
              showDomain={showDomain}
            />
          );
        })}
      </ol>
    </section>
  );
}
