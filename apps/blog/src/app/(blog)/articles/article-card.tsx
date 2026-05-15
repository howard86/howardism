import { Card, CardCta, CardDescription, CardTitle } from "@/app/(common)/card";
import { formatDateShort } from "@/utils/time";

import type { ArticleMeta } from "./service";

interface ArticleCardProps {
  meta: ArticleMeta;
  slug: string;
}

export default function ArticleCard({ slug, meta }: ArticleCardProps) {
  return (
    <Card as="article">
      <div className="relative z-10 order-first mb-3 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
        <time dateTime={meta.date}>{formatDateShort(meta.date)}</time>
        {" — "}
        <span className="text-brand">{meta.tag}</span>
        {" · "}
        {meta.readingTime} min read
      </div>
      <CardTitle href={`/articles/${slug}`}>{meta.title}</CardTitle>
      <CardDescription>{meta.description}</CardDescription>
      <CardCta>Read article</CardCta>
    </Card>
  );
}
