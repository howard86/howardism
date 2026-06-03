"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const HIGHLIGHT_ALL = "article-find";
const HIGHLIGHT_ACTIVE = "article-find-active";
const BODY_SELECTOR = "[data-article-body]";
const MIN_QUERY_LENGTH = 2;

// Injected at runtime rather than living in globals.css: Turbopack's build-time
// CSS parser does not recognise the `::highlight()` pseudo-element and drops the
// rules. Browsers parse them fine, so we add them to <head> on first use.
const STYLE_ELEMENT_ID = "article-find-highlight-styles";
const HIGHLIGHT_CSS = `::highlight(${HIGHLIGHT_ALL}){background-color:oklch(from var(--brand) l c h / 0.22);}
::highlight(${HIGHLIGHT_ACTIVE}){background-color:var(--brand);color:var(--primary-foreground);}
.dark ::highlight(${HIGHLIGHT_ALL}){background-color:oklch(from var(--brand) l c h / 0.34);}`;

function ensureHighlightStyles(): void {
  if (
    typeof document === "undefined" ||
    document.getElementById(STYLE_ELEMENT_ID)
  ) {
    return;
  }
  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = HIGHLIGHT_CSS;
  document.head.appendChild(style);
}

export interface FindHighlights {
  /** Total matches in the article body. */
  count: number;
  /** 0-based index of the active match, or -1 when there are none. */
  current: number;
  goNext: () => void;
  goPrev: () => void;
}

function supportsHighlights(): boolean {
  return typeof CSS !== "undefined" && "highlights" in CSS;
}

function clearHighlights(): void {
  if (!supportsHighlights()) {
    return;
  }
  CSS.highlights.delete(HIGHLIGHT_ALL);
  CSS.highlights.delete(HIGHLIGHT_ACTIVE);
}

/** Build a Range for every case-insensitive occurrence of `query`, in order. */
function collectRanges(root: HTMLElement, query: string): Range[] {
  const ranges: Range[] = [];
  const needle = query.toLowerCase();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let node = walker.nextNode();
  while (node) {
    const haystack = node.nodeValue?.toLowerCase() ?? "";
    let from = haystack.indexOf(needle);
    while (from !== -1) {
      const range = document.createRange();
      range.setStart(node, from);
      range.setEnd(node, from + needle.length);
      ranges.push(range);
      from = haystack.indexOf(needle, from + needle.length);
    }
    node = walker.nextNode();
  }
  return ranges;
}

/**
 * Highlight every occurrence of `query` in the article body via the CSS Custom
 * Highlight API — no DOM mutation, so it never fights React's ownership of the
 * rendered MDX. Returns the match count, the active index, and prev/next
 * controls that move the lone "active" highlight and scroll it into view.
 * Inert (count 0) when `active` is false, the query is too short, or the
 * browser lacks the API.
 */
export function useFindHighlights(
  query: string,
  active: boolean
): FindHighlights {
  const rangesRef = useRef<Range[]>([]);
  const currentRef = useRef(-1);
  const [state, setState] = useState({ count: 0, current: -1 });

  const setActive = useCallback((index: number) => {
    const ranges = rangesRef.current;
    if (!(supportsHighlights() && ranges.length > 0)) {
      return;
    }
    const wrapped = ((index % ranges.length) + ranges.length) % ranges.length;
    const range = ranges[wrapped];
    CSS.highlights.set(HIGHLIGHT_ACTIVE, new Highlight(range));
    range.startContainer.parentElement?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
    currentRef.current = wrapped;
    setState((prev) => ({ count: prev.count, current: wrapped }));
  }, []);

  // Rebuild highlights whenever the query (or open state) changes.
  useEffect(() => {
    const trimmed = query.trim();
    const root =
      active && supportsHighlights() && trimmed.length >= MIN_QUERY_LENGTH
        ? document.querySelector<HTMLElement>(BODY_SELECTOR)
        : null;

    if (!root) {
      clearHighlights();
      rangesRef.current = [];
      currentRef.current = -1;
      setState({ count: 0, current: -1 });
      return;
    }

    ensureHighlightStyles();
    const ranges = collectRanges(root, trimmed);
    rangesRef.current = ranges;

    if (ranges.length === 0) {
      clearHighlights();
      currentRef.current = -1;
      setState({ count: 0, current: -1 });
      return;
    }

    CSS.highlights.set(HIGHLIGHT_ALL, new Highlight(...ranges));
    CSS.highlights.set(HIGHLIGHT_ACTIVE, new Highlight(ranges[0]));
    ranges[0].startContainer.parentElement?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
    currentRef.current = 0;
    setState({ count: ranges.length, current: 0 });
  }, [query, active]);

  // Tear highlights down on unmount.
  useEffect(() => clearHighlights, []);

  const goNext = useCallback(
    () => setActive(currentRef.current + 1),
    [setActive]
  );
  const goPrev = useCallback(
    () => setActive(currentRef.current - 1),
    [setActive]
  );

  return { count: state.count, current: state.current, goNext, goPrev };
}
