"use client";

import { useEffect, useRef, useState } from "react";

export interface UseScrollSpyParams {
  defaultSectionId?: string | null;
  fallbackOffsetPx?: number;
  sectionIds: string[];
}

const DEFAULT_FALLBACK_OFFSET_PX = 96;

/**
 * Tracks which section is "in view" via IntersectionObserver. When multiple
 * sections are intersecting the rootMargin band, the topmost wins. When none
 * are, falls back to the last section whose top is above `fallbackOffsetPx` —
 * this keeps the highlight on the section the reader is currently inside,
 * rather than snapping back to the first when scrolling past a long block.
 *
 * The observer's top margin is tied to `fallbackOffsetPx` (default 96px) so
 * the intersection band and the fallback anchor share a single threshold —
 * otherwise a viewport-relative top margin and a fixed-pixel fallback drift
 * apart and open a dead zone where neither strategy fires. The bottom margin
 * (-65%) highlights what's near the top of the viewport, not what's about to
 * leave from the bottom.
 */
export default function useScrollSpy({
  defaultSectionId = null,
  fallbackOffsetPx = DEFAULT_FALLBACK_OFFSET_PX,
  sectionIds,
}: UseScrollSpyParams): string | null {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    defaultSectionId
  );
  const visibleRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (sectionIds.length === 0) {
      setActiveSectionId(null);
      return;
    }

    const elements = collectElements(sectionIds);
    if (elements.length === 0) {
      return;
    }
    // The effect already resolved every id; the callbacks below read from this
    // rather than going back to `document.getElementById` per tick.
    const byId = new Map(elements.map((el) => [el.id, el]));

    visibleRef.current = new Set();

    const recompute = (rects?: Map<Element, DOMRectReadOnly>) => {
      const topMostId = findTopMostVisibleId(visibleRef.current, byId);
      if (topMostId) {
        setActiveSectionId(topMostId);
        return;
      }
      setActiveSectionId(
        findLastAboveAnchorId(elements, fallbackOffsetPx, rects) ??
          elements[0].id
      );
    };

    const observer = new IntersectionObserver(
      (entries) => {
        // The observer already measured its own targets this tick, so the
        // fallback scan can use those rects instead of forcing a layout read.
        const rects = new Map<Element, DOMRectReadOnly>();
        for (const entry of entries) {
          rects.set(entry.target, entry.boundingClientRect);
          const id = entry.target.id;
          if (entry.isIntersecting) {
            visibleRef.current.add(id);
          } else {
            visibleRef.current.delete(id);
          }
        }
        recompute(rects);
      },
      { rootMargin: `-${fallbackOffsetPx}px 0px -65% 0px`, threshold: 0 }
    );

    for (const el of elements) {
      observer.observe(el);
    }

    recompute();

    return () => {
      observer.disconnect();
    };
  }, [sectionIds, fallbackOffsetPx]);

  return activeSectionId;
}

function collectElements(ids: string[]): HTMLElement[] {
  const elements: HTMLElement[] = [];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) {
      elements.push(el);
    }
  }
  return elements;
}

function findTopMostVisibleId(
  visibleIds: Iterable<string>,
  byId: ReadonlyMap<string, HTMLElement>
): string | null {
  let topMost: { id: string; top: number } | null = null;
  for (const id of visibleIds) {
    const el = byId.get(id);
    if (!el) {
      continue;
    }
    const top = el.getBoundingClientRect().top;
    if (!topMost || top < topMost.top) {
      topMost = { id, top };
    }
  }
  return topMost?.id ?? null;
}

function findLastAboveAnchorId(
  elements: HTMLElement[],
  offsetPx: number,
  rects?: Map<Element, DOMRectReadOnly>
): string | null {
  let fallback: string | null = null;
  for (const el of elements) {
    // Headings are in document order, so their tops ascend: the first one at
    // or below the anchor ends the scan, and everything after it is measured
    // only to be discarded.
    const top = (rects?.get(el) ?? el.getBoundingClientRect()).top;
    if (top >= offsetPx) {
      break;
    }
    fallback = el.id;
  }
  return fallback;
}
