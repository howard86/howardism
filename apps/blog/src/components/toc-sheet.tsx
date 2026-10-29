"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@howardism/ui/components/sheet";
import { LeftToRightListBulletIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ArticleToc } from "@/app/(blog)/articles/[slug]/article-toc";

import { useArticleNav } from "./article-nav-context";

/**
 * Section navigation reachable from the site bar on article pages. Mirrors the
 * desktop rail's scroll-spy TOC, but always reachable while scrolling — and the
 * only TOC on viewports below the `rail:` breakpoint. Hidden when the article
 * has too few headings to navigate.
 */
export function TocSheet({
  open: controlledOpen,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const nav = useArticleNav();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const pendingId = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useCallback(
    (id: string) => {
      pendingId.current = id;
      setOpen(false);
    },
    [setOpen]
  );
  const scrollAfterClose = useCallback(() => {
    const id = pendingId.current;
    pendingId.current = null;
    if (!id) {
      return;
    }
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: "start" });
      history.pushState(null, "", `#${encodeURIComponent(id)}`);
    });
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const active = listRef.current?.querySelector<HTMLElement>(
      '[aria-current="location"]'
    );
    const container = listRef.current;
    if (active && container) {
      container.scrollTop +=
        active.getBoundingClientRect().top -
        container.getBoundingClientRect().top -
        (container.clientHeight - active.clientHeight) / 2;
    }
  }, [open]);

  if (!nav || nav.headings.length === 0) {
    return null;
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      {controlledOpen === undefined ? (
        <SheetTrigger
          aria-label="On this page"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <HugeiconsIcon className="size-4" icon={LeftToRightListBulletIcon} />
        </SheetTrigger>
      ) : null}
      <SheetContent
        className="w-72"
        onCloseAutoFocus={scrollAfterClose}
        side="left"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-lg tracking-[-0.015em]">
            On this page
          </SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" ref={listRef}>
          <ArticleToc headings={nav.headings} hideLabel onNavigate={navigate} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
