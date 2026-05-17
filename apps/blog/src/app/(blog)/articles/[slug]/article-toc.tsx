"use client";

import { cn } from "@howardism/ui/lib/utils";
import { useMemo } from "react";

import useScrollSpy from "@/hooks/use-scroll-spy";

import type { ArticleHeading } from "../service";

interface ArticleTocProps {
  headings: ArticleHeading[];
}

export function ArticleToc({ headings }: ArticleTocProps) {
  const sectionIds = useMemo(() => headings.map((h) => h.id), [headings]);
  const activeId = useScrollSpy({
    defaultSectionId: sectionIds[0] ?? null,
    sectionIds,
  });

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav aria-label="On this page" className="font-mono text-xs">
      <div className="mb-3 font-medium text-foreground-subtle uppercase tracking-[0.16em]">
        On this page
      </div>
      <ol className="m-0 flex list-none flex-col gap-1.5 pl-0">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <li
              className={cn(
                "border-transparent border-l-2 pl-3 leading-[1.4] transition-colors",
                heading.depth === 3 && "pl-6",
                isActive && "border-brand text-foreground"
              )}
              key={heading.id}
            >
              <a
                className={cn(
                  "no-underline transition-colors hover:text-foreground",
                  isActive ? "text-foreground" : "text-foreground-subtle"
                )}
                href={`#${heading.id}`}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
