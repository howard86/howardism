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
 * Caller is responsible for the rootMargin via mutating the observer or
 * accepting the default band. The current band ("-12% 0px -65% 0px") is
 * intentional: highlights what's near the top of the viewport, not what's
 * about to leave from the bottom.
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

    visibleRef.current = new Set();

    const recompute = () => {
      const topMostId = findTopMostVisibleId(visibleRef.current);
      if (topMostId) {
        setActiveSectionId(topMostId);
        return;
      }
      setActiveSectionId(
        findLastAboveAnchorId(elements, fallbackOffsetPx) ?? elements[0].id
      );
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            visibleRef.current.add(id);
          } else {
            visibleRef.current.delete(id);
          }
        }
        recompute();
      },
      { rootMargin: "-12% 0px -65% 0px", threshold: 0 }
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

function findTopMostVisibleId(visibleIds: Iterable<string>): string | null {
  let topMost: { id: string; top: number } | null = null;
  for (const id of visibleIds) {
    const el = document.getElementById(id);
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
  offsetPx: number
): string | null {
  let fallback: string | null = null;
  for (const el of elements) {
    if (el.getBoundingClientRect().top < offsetPx) {
      fallback = el.id;
    }
  }
  return fallback;
}
