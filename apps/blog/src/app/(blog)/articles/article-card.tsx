import Link from "next/link";

import { formatDateShort } from "@/utils/time";

import type { ArticleMeta } from "./service";

interface ArticleCardProps {
  meta: ArticleMeta;
  slug: string;
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16" {...props}>
      <path
        d="M6.75 5.75 9.25 8l-2.5 2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function ArticleCard({ slug, meta }: ArticleCardProps) {
  return (
    <article className="group relative flex flex-col items-start">
      <Link
        className="block no-underline focus:outline-none"
        href={`/articles/${slug}`}
      >
        <div className="absolute -inset-x-4 -inset-y-6 z-0 scale-95 bg-muted opacity-0 transition group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 sm:-inset-x-6 sm:rounded-2xl" />
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
          <h3 className="m-0 font-semibold text-base text-foreground tracking-tight">
            {meta.title}
          </h3>
          <p className="mt-2 text-foreground/80 text-sm leading-[1.55]">
            {meta.description}
          </p>
          <span
            aria-hidden="true"
            className="mt-4 flex items-center font-medium text-primary text-sm"
          >
            Read article
            <ChevronRightIcon className="ml-1 h-4 w-4 stroke-current" />
          </span>
        </div>
      </Link>
    </article>
  );
}
