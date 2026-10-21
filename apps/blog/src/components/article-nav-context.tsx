"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { ArticleHeading } from "@/app/(blog)/articles/service";

export interface ArticleNav {
  headings: ArticleHeading[];
  /** Whole-article reading time in minutes, for the running head's time left. */
  readingTime?: number;
  slug: string;
}

interface ArticleNavContextValue {
  /** The article currently being read, or null on non-article routes. */
  nav: ArticleNav | null;
  setNav: (nav: ArticleNav | null) => void;
}

const ArticleNavContext = createContext<ArticleNavContextValue | null>(null);

/**
 * Holds the active article's nav metadata so the global site bar can render
 * reader controls (TOC, progress, resume) without threading props through every
 * route. The article layout publishes via {@link PublishArticleNav}; the bar
 * reads via {@link useArticleNav}.
 */
export function ArticleNavProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<ArticleNav | null>(null);
  const value = useMemo(() => ({ nav, setNav }), [nav]);
  return <ArticleNavContext value={value}>{children}</ArticleNavContext>;
}

export function useArticleNav(): ArticleNav | null {
  return useContext(ArticleNavContext)?.nav ?? null;
}

/**
 * Rendered inside the (server) article layout to publish the current article's
 * headings/slug into context for the lifetime of that page, clearing on unmount.
 */
export function PublishArticleNav({
  headings,
  readingTime,
  slug,
}: {
  headings: ArticleHeading[];
  readingTime?: number;
  slug: string;
}) {
  const ctx = useContext(ArticleNavContext);
  const setNav = ctx?.setNav;

  useEffect(() => {
    if (!setNav) {
      return;
    }
    setNav({ headings, readingTime, slug });
    return () => setNav(null);
  }, [setNav, headings, readingTime, slug]);

  return null;
}
