"use client";

import type { Throttled } from "@/utils/throttle";
import { throttle } from "@/utils/throttle";

/** How close to the viewport top a heading sits before it counts as active. */
export const HEADING_ACTIVE_OFFSET_PX = 120;

const SCROLL_THROTTLE_MS = 50;

export interface HeadingOffset {
  id: string;
  /** Document-space Y of the heading's top edge. */
  top: number;
}

export interface ArticleScrollFrame {
  /** Document-space Y of the `<article>` element's top edge. */
  articleTop: number;
  /** Bumped whenever the cached geometry is re-measured. */
  generation: number;
  /** The subscriber's headings, ascending by document-space top. */
  headings: readonly HeadingOffset[];
  /** Progress through the article body, clamped to 0-1. */
  progress: number;
  /** Scrollable distance inside the article; `<= 0` when it fits the viewport. */
  scrollable: number;
  scrollY: number;
}

type Listener = (frame: ArticleScrollFrame | null) => void;

interface Subscription {
  headings: readonly HeadingOffset[];
  ids: readonly string[];
  listener: Listener;
}

/**
 * One shared scroll subscription for the whole article chrome. Geometry — the
 * article box and every subscriber's heading offsets — is document-space, so
 * it cannot change while the page scrolls; it is measured on subscribe and
 * re-measured only on resize. A scroll tick then reads `window.scrollY` and
 * nothing else, so the progress bar's width write no longer forces a
 * synchronous layout on the next tick's rect read.
 */
const subscriptions = new Set<Subscription>();

const EMPTY_HEADINGS: readonly HeadingOffset[] = [];

let article: HTMLElement | null = null;
let observedArticle: HTMLElement | null = null;
let articleTop = 0;
let scrollable = 0;
let generation = 0;
let onScroll: Throttled<[]> | null = null;
let resizeObserver: ResizeObserver | null = null;

function measureGeometry(): void {
  generation += 1;
  article = document.querySelector("article");

  if (!article) {
    articleTop = 0;
    scrollable = 0;
    for (const sub of subscriptions) {
      sub.headings = EMPTY_HEADINGS;
    }
    return;
  }

  articleTop = article.getBoundingClientRect().top + window.scrollY;
  scrollable = article.offsetHeight - window.innerHeight;

  // Subscribers overlap — the progress bar and the focus plate track the same
  // H2s — so each id is resolved and measured at most once per pass.
  const tops = new Map<string, number | null>();
  for (const sub of subscriptions) {
    const next: HeadingOffset[] = [];
    for (const id of sub.ids) {
      let top = tops.get(id);
      if (top === undefined) {
        const el = document.getElementById(id);
        top = el ? el.getBoundingClientRect().top + window.scrollY : null;
        tops.set(id, top);
      }
      if (top !== null) {
        next.push({ id, top });
      }
    }
    next.sort((a, b) => a.top - b.top);
    sub.headings = next;
  }

  if (resizeObserver && article !== observedArticle) {
    resizeObserver.disconnect();
    resizeObserver.observe(article);
    observedArticle = article;
  }
}

function emit(): void {
  if (!article) {
    for (const sub of subscriptions) {
      sub.listener(null);
    }
    return;
  }

  const { scrollY } = window;
  const scrolled = scrollY - articleTop;
  let ratio = 0;
  if (scrollable > 0) {
    ratio = scrolled / scrollable;
  } else if (scrolled > 0) {
    ratio = 1;
  }
  const progress = Math.min(1, Math.max(0, ratio));

  for (const sub of subscriptions) {
    sub.listener({
      articleTop,
      generation,
      headings: sub.headings,
      progress,
      scrollable,
      scrollY,
    });
  }
}

function remeasure(): void {
  measureGeometry();
  emit();
}

function attach(): void {
  onScroll = throttle(emit, SCROLL_THROTTLE_MS);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", remeasure);
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(remeasure);
  }
}

function detach(): void {
  if (onScroll) {
    onScroll.cancel();
    window.removeEventListener("scroll", onScroll);
    onScroll = null;
  }
  window.removeEventListener("resize", remeasure);
  resizeObserver?.disconnect();
  resizeObserver = null;
  observedArticle = null;
  article = null;
  articleTop = 0;
  scrollable = 0;
}

/**
 * Registers `listener` against the shared subscription, measuring `headingIds`
 * once up front. Returns the teardown, so callers use it as the body of a
 * `useEffect`; the last unsubscribe tears the shared listeners down, which is
 * also what resets this module's state between tests.
 */
export function subscribeToArticleScroll(
  headingIds: readonly string[],
  listener: Listener
): () => void {
  const sub: Subscription = {
    headings: EMPTY_HEADINGS,
    ids: headingIds,
    listener,
  };
  subscriptions.add(sub);
  if (subscriptions.size === 1) {
    attach();
  }
  remeasure();

  return () => {
    subscriptions.delete(sub);
    if (subscriptions.size === 0) {
      detach();
    }
  };
}

/**
 * Index of the last heading the reader has scrolled past, or -1 when none.
 * `frame.headings` ascends, so this is a binary search rather than the
 * per-heading rect sweep it replaces.
 */
export function findActiveHeadingIndex(
  frame: ArticleScrollFrame,
  offsetPx: number = HEADING_ACTIVE_OFFSET_PX
): number {
  const { headings, scrollY } = frame;
  let low = 0;
  let high = headings.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (scrollY >= headings[mid].top - offsetPx) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
}
