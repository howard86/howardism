"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@howardism/ui/components/sheet";

import { ArticleToc } from "@/app/(blog)/articles/[slug]/article-toc";

import { useArticleNav } from "./article-nav-context";

/**
 * Section navigation reachable from the site bar on article pages. Mirrors the
 * desktop rail's scroll-spy TOC, but always reachable while scrolling — and the
 * only TOC on viewports below the `rail:` breakpoint. Hidden when the article
 * has too few headings to navigate.
 */
export function TocSheet() {
  const nav = useArticleNav();

  if (!nav || nav.headings.length < 2) {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger
        aria-label="On this page"
        className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <svg
          aria-hidden="true"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
        >
          <line x1="4" x2="20" y1="7" y2="7" />
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="14" y1="17" y2="17" />
        </svg>
      </SheetTrigger>
      <SheetContent className="w-72" side="left">
        <SheetHeader>
          <SheetTitle className="font-display text-lg tracking-[-0.015em]">
            On this page
          </SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4">
          <ArticleToc headings={nav.headings} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
