"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  SearchList01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useArticleNav } from "@/components/article-nav-context";

import { useFindHighlights } from "./use-find-highlights";

function matchStatus(count: number, current: number, query: string): string {
  if (count > 0) {
    return `${current + 1}/${count}`;
  }
  if (query.trim().length > 0) {
    return "0/0";
  }
  return "";
}

/**
 * "Find in this article" control for the site bar (article pages only). Opens a
 * floating bar that highlights and cycles through matches in the article body
 * via the CSS Custom Highlight API. Distinct from the global search palette.
 */
export function ArticleFind() {
  const nav = useArticleNav();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { count, current, goNext, goPrev } = useFindHighlights(query, open);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) {
        goPrev();
      } else {
        goNext();
      }
    }
  };

  if (!nav) {
    return null;
  }

  const status = matchStatus(count, current, query);

  return (
    <>
      <button
        aria-label="Find in article"
        aria-pressed={open}
        className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground aria-pressed:bg-accent aria-pressed:text-foreground"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <HugeiconsIcon className="size-[18px]" icon={SearchList01Icon} />
      </button>

      {open && (
        <search
          aria-label="Find in article"
          className="fixed top-[4.5rem] right-4 z-[60] flex items-center gap-1.5 rounded-full border border-border bg-popover py-1.5 pr-1.5 pl-3.5 text-popover-foreground shadow-paper-lg ring-1 ring-foreground/10 sm:right-6"
        >
          <input
            aria-label="Find text in article"
            className="w-40 bg-transparent font-body text-[14px] outline-none placeholder:text-muted-foreground sm:w-52"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find in article"
            ref={inputRef}
            type="text"
            value={query}
          />
          <span className="min-w-10 shrink-0 text-right font-mono text-[11px] text-foreground-subtle tabular-nums">
            {status}
          </span>
          <button
            aria-label="Previous match"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
            disabled={count === 0}
            onClick={goPrev}
            type="button"
          >
            <HugeiconsIcon className="size-4" icon={ArrowUp01Icon} />
          </button>
          <button
            aria-label="Next match"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
            disabled={count === 0}
            onClick={goNext}
            type="button"
          >
            <HugeiconsIcon className="size-4" icon={ArrowDown01Icon} />
          </button>
          <button
            aria-label="Close find"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={close}
            type="button"
          >
            <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
          </button>
        </search>
      )}
    </>
  );
}
