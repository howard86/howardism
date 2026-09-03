"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";

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

interface TextNodeEntry {
  lower: string;
  node: Node;
}

/**
 * Every text node under `root`, with its text lowercased once. The article
 * body is static MDX, so this survives the whole find session — otherwise the
 * whole body is walked and lowercased again on every keystroke.
 */
function indexTextNodes(root: HTMLElement): TextNodeEntry[] {
  const entries: TextNodeEntry[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let node = walker.nextNode();
  while (node) {
    entries.push({ node, lower: node.nodeValue?.toLowerCase() ?? "" });
    node = walker.nextNode();
  }
  return entries;
}

/** Build a Range for every case-insensitive occurrence of `query`, in order. */
function collectRanges(
  entries: readonly TextNodeEntry[],
  query: string
): Range[] {
  const ranges: Range[] = [];
  const needle = query.toLowerCase();

  for (const { node, lower } of entries) {
    let from = lower.indexOf(needle);
    while (from !== -1) {
      const range = document.createRange();
      range.setStart(node, from);
      range.setEnd(node, from + needle.length);
      ranges.push(range);
      from = lower.indexOf(needle, from + needle.length);
    }
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
  active: boolean,
  slug: string | null
): FindHighlights {
  const rangesRef = useRef<Range[]>([]);
  const currentRef = useRef(-1);
  /** The body index, tagged with the article it was built from. */
  const indexRef = useRef<{ entries: TextNodeEntry[]; slug: string } | null>(
    null
  );
  const scrolledForRef = useRef<string | null>(null);
  const [state, setState] = useState({ count: 0, current: -1 });
  // Rebuilding the ranges is synchronous over the whole article body, so let
  // the find input paint the typed character before matching against it.
  const deferredQuery = useDeferredValue(query);

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

  // Index the body once per article per open panel. Keyed on `slug` as well as
  // `active` because the find bar lives in the site header: a client-side
  // navigation to another article replaces the body under an open panel, and an
  // index built from the previous one holds text nodes that are no longer in the
  // document. Declared before the rebuild effect so it has run by the time that
  // one reads the index on the same commit.
  useEffect(() => {
    const root =
      active && slug !== null
        ? document.querySelector<HTMLElement>(BODY_SELECTOR)
        : null;
    indexRef.current =
      root && slug !== null ? { entries: indexTextNodes(root), slug } : null;
    // A new body means the term has not been scrolled to in it yet.
    scrolledForRef.current = null;
  }, [active, slug]);

  // Rebuild highlights whenever the query (or open state) changes.
  useEffect(() => {
    const trimmed = deferredQuery.trim();
    // `index.slug === slug` is the guard, not just a memo key: an index built
    // from the previous article's body must never be matched against.
    const index = indexRef.current;
    const entries =
      active &&
      index?.slug === slug &&
      supportsHighlights() &&
      trimmed.length >= MIN_QUERY_LENGTH
        ? index.entries
        : null;

    if (!entries) {
      clearHighlights();
      rangesRef.current = [];
      currentRef.current = -1;
      scrolledForRef.current = null;
      setState({ count: 0, current: -1 });
      return;
    }

    ensureHighlightStyles();
    const ranges = collectRanges(entries, trimmed);
    rangesRef.current = ranges;

    if (ranges.length === 0) {
      clearHighlights();
      currentRef.current = -1;
      setState({ count: 0, current: -1 });
      return;
    }

    CSS.highlights.set(HIGHLIGHT_ALL, new Highlight(...ranges));
    CSS.highlights.set(HIGHLIGHT_ACTIVE, new Highlight(ranges[0]));
    // Only when the search term itself moved: a rebuild that lands on the same
    // term (a trailing space, the panel re-opening on it) would otherwise
    // restart the smooth scroll from wherever the last one had got to.
    if (scrolledForRef.current !== trimmed) {
      scrolledForRef.current = trimmed;
      ranges[0].startContainer.parentElement?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
    currentRef.current = 0;
    setState({ count: ranges.length, current: 0 });
  }, [deferredQuery, active, slug]);

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
