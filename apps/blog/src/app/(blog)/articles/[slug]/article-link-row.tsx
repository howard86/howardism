import { DomainDot } from "@/components/howardism/domain-dot";
import { InternalLink } from "@/components/internal-link";
import { truncate } from "@/utils/text";

import type { ArticleLink } from "../service";

const ARTICLE_LINK_DESCRIPTION_MAX = 120;

interface ArticleLinkRowProps {
  link: ArticleLink;
}

export function ArticleLinkRow({ link }: ArticleLinkRowProps) {
  const { slug, meta, citedIn, citedCount } = link;
  return (
    <li className="flex flex-col gap-0.5">
      <span className="leading-[1.25]">
        {meta.domain && <DomainDot domain={meta.domain} size={6} />}
        <InternalLink
          className="font-display font-medium text-[0.95rem] text-foreground no-underline hover:text-[var(--article-accent)]"
          href={`/articles/${slug}`}
          previewMeta={{
            description: meta.description,
            tag: meta.tag,
            title: meta.title,
          }}
        >
          {meta.title}
        </InternalLink>
        {citedCount !== undefined && citedCount > 1 && (
          <span
            className="ml-1.5 font-mono text-[0.7rem] text-muted-foreground"
            title={`Links here ${citedCount} times`}
          >
            ×{citedCount}
          </span>
        )}
      </span>
      {citedIn ? (
        <p className="m-0 border-border border-l-2 pl-2 font-body text-muted-foreground text-xs italic leading-[1.45]">
          {citedIn}
        </p>
      ) : (
        <p className="m-0 font-body text-muted-foreground text-xs leading-[1.45]">
          {truncate(meta.description, ARTICLE_LINK_DESCRIPTION_MAX)}
        </p>
      )}
    </li>
  );
}
