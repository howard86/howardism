"use client";

import throttle from "lodash.throttle";
import { useEffect, useState } from "react";

import type { ArticleHeading } from "@/app/(blog)/articles/service";

interface ReadingProgressProps {
  headings?: ArticleHeading[];
}

interface TickPosition {
  id: string;
  isPast: boolean;
  offset: number;
}

/**
 * Reading progress through the article body, rendered as the site bar's bottom
 * edge. Tracks scroll position relative to the page's `<article>` element so it
 * reflects body progress rather than whole-document scroll.
 * When headings are provided (spike), renders H2 tick marks at their real offsets.
 */
export function ReadingProgress({ headings }: ReadingProgressProps = {}) {
  const [progress, setProgress] = useState(0);
  const [ticks, setTicks] = useState<TickPosition[]>([]);

  useEffect(() => {
    const h2Headings = headings?.filter((h) => h.depth === 2) ?? [];
    if (h2Headings.length === 0) {
      setTicks([]);
      return;
    }

    const compute = () => {
      const article = document.querySelector("article");
      if (!article) {
        setProgress(0);
        setTicks([]);
        return;
      }
      const rect = article.getBoundingClientRect();
      const start = rect.top + window.scrollY;
      const scrollable = article.offsetHeight - window.innerHeight;
      const scrolled = window.scrollY - start;
      let ratio = 0;
      if (scrollable > 0) {
        ratio = scrolled / scrollable;
      } else if (scrolled <= 0) {
        ratio = 0;
      } else {
        ratio = 1;
      }
      setProgress(Math.min(1, Math.max(0, ratio)));

      const newTicks: TickPosition[] = [];
      for (const heading of h2Headings) {
        const el = document.getElementById(heading.id);
        if (el) {
          const elTop = el.getBoundingClientRect().top + window.scrollY;
          const relativePos = elTop - start;
          const tickOffset =
            scrollable > 0
              ? relativePos / (article.offsetHeight - window.innerHeight)
              : 0;
          const isPast = window.scrollY >= elTop - 120;
          newTicks.push({
            id: heading.id,
            offset: Math.min(1, Math.max(0, tickOffset)),
            isPast,
          });
        }
      }
      setTicks(newTicks);
    };

    const onScroll = throttle(compute, 50);
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      onScroll.cancel();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [headings]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
    >
      <div
        className="h-full origin-left bg-[var(--article-accent,var(--brand))] transition-[width] duration-150 ease-out"
        style={{ width: `${progress * 100}%` }}
      />

      {ticks.length > 0 && (
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
      )}
    </div>
  );
}
