"use client";

import { throttle } from "@/utils/throttle";

/** How close to the viewport top a heading sits before it counts as active. */
export const HEADING_ACTIVE_OFFSET_PX = 120;

const SCROLL_THROTTLE_MS = 50;

export interface ArticleScroll {
  /** Document-space Y of the `<article>` element's top edge. */
  articleTop: number;
  /** Progress through the article body, clamped to 0-1. */
  progress: number;
  /** Scrollable distance inside the article; `<= 0` when it fits the viewport. */
  scrollable: number;
}

/**
 * Measures scroll progress through the page's `<article>`, or null when the
 * page has none. Shared by the progress bar and the focus-mode running head so
 * both report the same number.
 */
export function measureArticleScroll(): ArticleScroll | null {
  const article = document.querySelector("article");
  if (!article) {
    return null;
  }
  const articleTop = article.getBoundingClientRect().top + window.scrollY;
  const scrollable = article.offsetHeight - window.innerHeight;
  const scrolled = window.scrollY - articleTop;
  let ratio = 0;
  if (scrollable > 0) {
    ratio = scrolled / scrollable;
  } else if (scrolled > 0) {
    ratio = 1;
  }
  return {
    articleTop,
    progress: Math.min(1, Math.max(0, ratio)),
    scrollable,
  };
}

/**
 * Runs `compute` once, then on throttled scroll/resize. Returns the teardown,
 * so callers use it as the body of a `useEffect`.
 */
export function subscribeToArticleScroll(compute: () => void): () => void {
  const onScroll = throttle(compute, SCROLL_THROTTLE_MS);
  compute();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  return () => {
    onScroll.cancel();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}
