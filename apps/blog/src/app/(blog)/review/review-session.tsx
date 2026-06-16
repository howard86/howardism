"use client";

import type { QuizConcept } from "@howardism/article-contract/manifests/quiz";
import { Button } from "@howardism/ui/components/button";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getDueCards,
  gradeCard,
  type ReviewGrade,
  useLearningState,
} from "@/utils/learning-state";

interface ReviewSessionProps {
  concepts: QuizConcept[];
}

const GRADES: { grade: ReviewGrade; label: string }[] = [
  { grade: "again", label: "Again" },
  { grade: "hard", label: "Hard" },
  { grade: "good", label: "Good" },
  { grade: "easy", label: "Easy" },
];

/**
 * Spaced-repetition review of every unlocked flashcard whose SM-2 schedule is
 * due. Cards are seeded when a reader masters a concept's MCQ; grading reschedules
 * them. Shows the oldest-due card, reveals the back on demand, and advances as
 * the live due list shrinks.
 */
export function ReviewSession({ concepts }: ReviewSessionProps) {
  const state = useLearningState();
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const backOf = useMemo(() => {
    const map = new Map<
      string,
      { back: string; title: string; slug: string }
    >();
    for (const concept of concepts) {
      for (const card of concept.cards) {
        map.set(`${concept.slug}::${card.front}`, {
          back: card.back,
          title: concept.title,
          slug: concept.slug,
        });
      }
    }
    return map;
  }, [concepts]);

  const due = getDueCards(state);
  const current = due[0];

  if (!current) {
    return (
      <div className="mt-6 rounded-md border border-border bg-card px-6 py-10 text-center">
        <p className="m-0 font-display text-[20px] text-foreground">
          {reviewed > 0
            ? `Nice — ${reviewed} reviewed. You're all caught up.`
            : "Nothing due for review."}
        </p>
        <p className="mt-2 font-body text-[15px] text-muted-foreground">
          Master a concept&apos;s quiz on any article to add its cards here.
        </p>
        <div className="mt-5 flex justify-center">
          <Button asChild size="sm" variant="outline">
            <Link href="/learn/ai-engineering">Open a skill tree</Link>
          </Button>
        </div>
      </div>
    );
  }

  const meta = backOf.get(`${current.slug}::${current.front}`);

  const handleGrade = (grade: ReviewGrade) => {
    gradeCard(current.slug, current.front, grade);
    setRevealed(false);
    setReviewed((n) => n + 1);
  };

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between font-mono text-[12px] text-foreground-subtle tracking-[0.12em]">
        <span>{due.length} due</span>
        <span>{reviewed} reviewed</span>
      </div>

      <div className="rounded-md border border-border bg-card px-6 py-8">
        {meta && (
          <Link
            className="font-mono text-[10.5px] text-brand uppercase tracking-[0.18em] no-underline hover:underline"
            href={`/articles/${current.slug}`}
          >
            {meta.title}
          </Link>
        )}
        <p className="mt-3 mb-0 font-display text-[clamp(18px,3vw,24px)] text-foreground leading-snug">
          {current.front}
        </p>

        {revealed ? (
          <>
            <p className="mt-5 border-brand border-l-2 pl-4 font-body text-[16px] text-muted-foreground leading-[1.6]">
              {meta?.back}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {GRADES.map(({ grade, label }) => (
                <Button
                  key={grade}
                  onClick={() => handleGrade(grade)}
                  size="sm"
                  variant="outline"
                >
                  {label}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-6">
            <Button onClick={() => setRevealed(true)} size="sm">
              Reveal answer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
