"use client";

import { useEffect, useMemo, useState } from "react";

import type { ArticleHeading } from "@/app/(blog)/articles/service";
import {
  findActiveHeadingIndex,
  subscribeToArticleScroll,
} from "@/hooks/use-article-scroll";

export function useArticleReadingState(headings: ArticleHeading[]) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const h2Headings = useMemo(
    () => headings.filter((h) => h.depth === 2),
    [headings]
  );
  const h2Ids = useMemo(() => h2Headings.map((h) => h.id), [h2Headings]);
  const textById = useMemo(
    () => new Map(h2Headings.map((h) => [h.id, h.text])),
    [h2Headings]
  );

  useEffect(
    () =>
      subscribeToArticleScroll(h2Ids, (frame) => {
        if (!frame) {
          setProgress(0);
          setActiveSection(null);
          return;
        }
        setProgress(Math.round(frame.progress * 100));
        const index = findActiveHeadingIndex(frame);
        setActiveSection(
          index < 0 ? null : (textById.get(frame.headings[index].id) ?? null)
        );
      }),
    [h2Ids, textById]
  );

  return { activeSection, progress };
}

export function formatMinutesLeft(
  readingTime: number | undefined,
  progress: number
): string | null {
  if (readingTime === undefined || readingTime <= 0) {
    return null;
  }
  const remaining = readingTime * (1 - Math.min(1, Math.max(0, progress)));
  if (remaining > 0 && remaining < 1) {
    return "<1 min left";
  }
  const minutes = Math.ceil(remaining);
  if (minutes <= 0) {
    return null;
  }
  return `${minutes} min left`;
}
