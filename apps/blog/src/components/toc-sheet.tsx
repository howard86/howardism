"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@howardism/ui/components/sheet";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

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
        <HugeiconsIcon className="size-4" icon={Menu01Icon} />
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
