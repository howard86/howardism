import Link from "next/link";

import { formatDateShort } from "@/utils/time";

import type { ArticleMeta } from "./service";

interface ArticleCardProps {
  meta: ArticleMeta;
  slug: string;
}

export default function ArticleCard({ slug, meta }: ArticleCardProps) {
  return (
    <article className="group relative">
      <Link
        className="block no-underline focus:outline-none"
        href={`/articles/${slug}`}
      >
        <div className="absolute -inset-x-4 -inset-y-4 z-0 scale-95 rounded-2xl bg-muted opacity-0 transition group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100" />
        <div className="relative z-10 flex flex-col items-start">
          <div className="mb-3 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
            <time dateTime={meta.date}>{formatDateShort(meta.date)}</time>
            {" — "}
            <span className="text-brand">{meta.tag}</span>
            {" · "}
            <span>
              <span aria-hidden="true">{meta.readingTime}′</span>
              <span className="sr-only">{meta.readingTime} minute read</span>
            </span>
          </div>
          <h3 className="m-0 font-display font-semibold text-[18px] text-foreground tracking-tight transition-colors group-hover:text-brand">
            {meta.title}
          </h3>
          <p className="mt-2 font-body text-[14px] text-foreground/80 leading-[1.55]">
            {meta.description}
          </p>
          <span
            aria-hidden="true"
            className="mt-4 inline-flex items-center font-medium font-mono text-[11px] text-brand uppercase tracking-[0.14em]"
          >
            Read article →
          </span>
        </div>
      </Link>
    </article>
  );
}
