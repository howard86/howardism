import { TopicDot } from "@/components/howardism/topic-dot";
import { InternalLink } from "@/components/internal-link";
import { truncate } from "@/utils/text";

import type { ArticleLink } from "../service";

const ARTICLE_LINK_DESCRIPTION_MAX = 120;

interface ArticleLinkRowProps {
  link: ArticleLink;
}

export function ArticleLinkRow({ link }: ArticleLinkRowProps) {
  const { slug, meta } = link;
  return (
    <li className="flex flex-col gap-0.5">
      <span className="leading-[1.25]">
        {meta.topic && <TopicDot size={6} topic={meta.topic} />}
        <InternalLink
          className="font-display font-medium text-[0.95rem] text-foreground no-underline hover:text-[var(--article-accent)]"
          href={`/articles/${slug}`}
          previewMeta={meta}
        >
          {meta.title}
        </InternalLink>
      </span>
      <p className="m-0 font-body text-muted-foreground text-xs leading-[1.45]">
        {truncate(meta.description, ARTICLE_LINK_DESCRIPTION_MAX)}
      </p>
    </li>
  );
}
