"use client";

import { memo, useEffect, useMemo, useState } from "react";

import type { ArticleHeading } from "@/app/(blog)/articles/service";
import type { ArticleScrollFrame } from "@/hooks/use-article-scroll";
import {
  findActiveHeadingIndex,
  subscribeToArticleScroll,
} from "@/hooks/use-article-scroll";

interface ReadingProgressProps {
  headings: ArticleHeading[];
}

interface TickPosition {
  id: string;
  isPast: boolean;
  offset: number;
}

const EMPTY_TICKS: readonly TickPosition[] = [];

function buildTicks(
  frame: ArticleScrollFrame,
  pastCount: number
): readonly TickPosition[] {
  const { articleTop, headings, scrollable } = frame;
  const ticks: TickPosition[] = [];
  for (const [index, heading] of headings.entries()) {
    ticks.push({
      id: heading.id,
      isPast: index < pastCount,
      offset:
        scrollable > 0
          ? Math.min(1, Math.max(0, (heading.top - articleTop) / scrollable))
          : 0,
    });
  }
  return ticks;
}

/**
 * Memoised so a scroll tick that only moves the bar — the common case, since
 * tick offsets are document-space and `isPast` flips at most once per heading
 * per read — commits the bar width and nothing else.
 */
function TickRow({ ticks }: { ticks: readonly TickPosition[] }) {
  if (ticks.length === 0) {
    return null;
  }
  return (
    <div className="absolute inset-0">
      {ticks.map((tick) => (
        <div
          className={
            tick.isPast
              ? "absolute top-0 h-full w-px bg-[var(--article-accent,var(--brand))]/30"
              : "absolute top-0 h-full w-px bg-background/50"
          }
          key={tick.id}
          style={{ left: `${tick.offset * 100}%` }}
        />
      ))}
    </div>
  );
}

const TickLayer = memo(TickRow);

/**
 * Reading progress through the article body, rendered as the site bar's bottom
 * edge. Tracks scroll position relative to the page's `<article>` element so it
 * reflects body progress rather than whole-document scroll. H2 headings are
 * marked as ticks at their real offsets, filled in once scrolled past.
 */
export function ReadingProgress({ headings }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [ticks, setTicks] = useState<readonly TickPosition[]>(EMPTY_TICKS);

  const h2Ids = useMemo(
    () => headings.filter((h) => h.depth === 2).map((h) => h.id),
    [headings]
  );

  useEffect(() => {
    let lastGeneration = -1;
    let lastPastCount = -1;

    return subscribeToArticleScroll(h2Ids, (frame) => {
      if (!frame) {
        lastGeneration = -1;
        lastPastCount = -1;
        setProgress(0);
        setTicks(EMPTY_TICKS);
        return;
      }
      setProgress(frame.progress);

      // Offsets only move when the geometry is re-measured, and `isPast` is a
      // prefix of the ascending heading list — so the ticks array keeps its
      // identity, and `TickLayer` bails out, until one of those two changes.
      const pastCount = findActiveHeadingIndex(frame) + 1;
      if (frame.generation === lastGeneration && pastCount === lastPastCount) {
        return;
      }
      lastGeneration = frame.generation;
      lastPastCount = pastCount;
      setTicks(buildTicks(frame, pastCount));
    });
  }, [h2Ids]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
    >
      <div
        className="h-full origin-left bg-[var(--article-accent,var(--brand))] transition-[width] duration-150 ease-out"
        style={{ width: `${progress * 100}%` }}
      />

      <TickLayer ticks={ticks} />
    </div>
  );
}
