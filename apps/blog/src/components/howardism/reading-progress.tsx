"use client";

import throttle from "lodash.throttle";
import { useEffect, useState } from "react";

/**
 * Reading progress through the article body, rendered as the site bar's bottom
 * edge. Tracks scroll position relative to the page's `<article>` element so it
 * reflects body progress rather than whole-document scroll.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const compute = () => {
      const article = document.querySelector("article");
      if (!article) {
        setProgress(0);
        return;
      }
      const rect = article.getBoundingClientRect();
      const start = rect.top + window.scrollY;
      const scrollable = article.offsetHeight - window.innerHeight;
      const scrolled = window.scrollY - start;
      let ratio = 0;
      if (scrollable > 0) {
        ratio = scrolled / scrollable;
      } else if (scrolled > 0) {
        ratio = 1;
      }
      setProgress(Math.min(1, Math.max(0, ratio)));
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
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
    >
      <div
        className="h-full origin-left bg-[var(--article-accent,var(--brand))] transition-[width] duration-150 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
