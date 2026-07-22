import { DomainDot } from "@/components/howardism/domain-dot";

import { DOMAIN_META } from "./domain-meta";
import { IndexRow } from "./index-row";
import type { ArticleDomain, ArticleEntity } from "./service";

interface DomainGroupProps {
  articles: ArticleEntity[];
  domain: ArticleDomain;
  limit?: number;
  navigable: ReadonlySet<string>;
}

const DEFAULT_LIMIT = 5;

/** Compact per-domain sub-section inside the Concept plate. */
export function DomainGroup({
  articles,
  domain,
  navigable,
  limit = DEFAULT_LIMIT,
}: DomainGroupProps) {
  const meta = DOMAIN_META[domain];
  const visible = articles.slice(0, limit);

  return (
    <div>
      <div className="flex items-baseline font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.18em]">
        <DomainDot domain={domain} />
        {meta.label}
        <span className="ml-2 text-foreground-subtle/60">
          {articles.length}
        </span>
      </div>

      <ol className="m-0 mt-3 list-none p-0">
        {visible.map((article, i) => (
          <IndexRow
            accent={meta.color}
            article={article}
            density="compact"
            first={i === 0}
            key={article.slug}
            navigable={navigable}
            ordinal={i + 1}
            showDomain={false}
          />
        ))}
      </ol>

      {articles.length > visible.length && (
        <a
          className="mt-2 inline-block border-current border-b pb-0.5 font-mono text-[11px] uppercase tracking-[0.18em]"
          href={`/articles/domain/${domain}`}
          style={{ color: meta.color }}
        >
          All {articles.length} →
        </a>
      )}
    </div>
  );
}
