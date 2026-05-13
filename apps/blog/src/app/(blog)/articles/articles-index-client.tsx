"use client";

import { cn } from "@howardism/ui/lib/utils";
import Link from "next/link";
import { Fragment, useState } from "react";

import { formatDateShort } from "@/utils/time";

import type { ArticleEntity } from "./service";

const ALL_TAG = "All";

interface ArticlesIndexClientProps {
  articles: ArticleEntity[];
}

export function ArticlesIndexClient({ articles }: ArticlesIndexClientProps) {
  const [activeTag, setActiveTag] = useState<string>(ALL_TAG);

  const tags = [
    ALL_TAG,
    ...Array.from(new Set(articles.map((a) => a.meta.tag))).sort(),
  ];

  const filtered =
    activeTag === ALL_TAG
      ? articles
      : articles.filter((a) => a.meta.tag === activeTag);

  return (
    <div>
      {/* Filter row — quiet inline text links, no pill chrome */}
      <div className="mb-2 flex flex-wrap items-baseline gap-x-0 gap-y-1 border-border border-t border-b py-3.5">
        <span className="mr-[18px] font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.18em]">
          Filed under
        </span>
        {tags.map((tag, i) => {
          const isActive = activeTag === tag;
          return (
            <Fragment key={tag}>
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="mx-2 text-foreground-subtle"
                >
                  ·
                </span>
              )}
              <button
                aria-pressed={isActive}
                className={cn(
                  "cursor-pointer border-0 bg-transparent p-0 font-body text-[15px] underline-offset-[3px] [text-decoration-thickness:1px]",
                  isActive
                    ? "text-brand italic underline"
                    : "text-muted-foreground not-italic no-underline"
                )}
                onClick={() => setActiveTag(tag)}
                type="button"
              >
                {tag}
              </button>
            </Fragment>
          );
        })}
        <span className="flex-1" />
        <span className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
          {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
        </span>
      </div>

      {/* Numbered index list */}
      <ol className="m-0 list-none p-0">
        {filtered.map((article, i) => (
          <li
            className={cn(
              i === filtered.length - 1
                ? "border-b-0"
                : "border-border border-b"
            )}
            key={article.slug}
          >
            <Link
              className="grid grid-cols-[80px_1fr_auto] items-baseline gap-8 py-7 text-inherit no-underline transition-[padding] focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4 motion-safe:focus-visible:pl-3 motion-safe:hover:pl-3"
              href={`/articles/${article.slug}`}
            >
              <span
                aria-hidden="true"
                className="select-none font-display font-light text-[52px] text-brand leading-[0.9] tracking-[-0.03em]"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="m-0 font-display font-medium text-[28px] text-foreground leading-[1.15] tracking-[-0.02em]">
                  {article.meta.title}
                </h2>
                <div className="mt-2.5 flex items-center gap-3 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
                  <time dateTime={article.meta.date}>
                    {formatDateShort(article.meta.date)}
                  </time>
                  <span aria-hidden="true" className="h-px w-3 bg-input" />
                  <span className="text-brand">{article.meta.tag}</span>
                </div>
              </div>
              <div className="whitespace-nowrap text-right font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]">
                {article.meta.readingTime}′<br />
                <span className="text-muted-foreground">read →</span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
