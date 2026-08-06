"use client";

import Link from "next/link";

import { countDueCards, useLearningState } from "@/utils/learning-state";

/**
 * Header nudge: links to `/review` showing how many flashcards are due. Renders
 * nothing when none are due (and during SSR, since the server snapshot is empty)
 * so it never causes a hydration mismatch.
 */
export function ReviewBadge() {
  const state = useLearningState();
  const due = countDueCards(state);

  if (due === 0) {
    return null;
  }

  return (
    <Link
      aria-label={`${due} flashcards due for review`}
      className="flex h-7 items-center gap-1.5 rounded-full bg-brand/10 px-3 font-medium font-mono text-[11px] text-brand uppercase tracking-[0.1em] transition-colors hover:bg-brand/20"
      href="/review"
    >
      <span aria-hidden="true">●</span>
      {due} due
    </Link>
  );
}
