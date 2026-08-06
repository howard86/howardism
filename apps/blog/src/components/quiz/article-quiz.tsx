"use client";

import type { QuizConcept } from "@howardism/article-contract/manifests/quiz";
import { Button } from "@howardism/ui/components/button";
import { cn } from "@howardism/ui/lib/utils";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";

import {
  isMastered,
  MASTERY_PASS_RATIO,
  recordMcqResult,
  useLearningState,
} from "@/utils/learning-state";

interface ArticleQuizProps {
  concept: QuizConcept;
}

const CHALLENGE_RE = /^(\d+)-(\d+)$/;

function buildChallengeHref(
  slug: string,
  score: number,
  total: number
): string {
  if (typeof window === "undefined") {
    return "";
  }
  const url = new URL(`/articles/${slug}`, window.location.origin);
  url.searchParams.set("c", `${score}-${total}`);
  url.hash = "test-yourself";
  return url.toString();
}

/**
 * In-article active-recall quiz. Renders the concept's MCQs, grades them client
 * side, and — once the reader clears the pass ratio — records mastery + seeds
 * the concept's flashcards into spaced review. All state is local; a "challenge
 * a friend" link encodes the score so nothing is stored server-side.
 */
export function ArticleQuiz({ concept }: ArticleQuizProps) {
  const state = useLearningState();
  const groupId = useId();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [challenge, setChallenge] = useState<{
    score: number;
    total: number;
  } | null>(null);
  const [shareLabel, setShareLabel] = useState("Challenge a friend");

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("c");
    const match = raw?.match(CHALLENGE_RE);
    if (match) {
      setChallenge({ score: Number(match[1]), total: Number(match[2]) });
    }
  }, []);

  const total = concept.mcq.length;
  const correctCount = useMemo(
    () =>
      concept.mcq.reduce(
        (sum, question, index) =>
          sum + (answers[index] === question.answerIdx ? 1 : 0),
        0
      ),
    [answers, concept.mcq]
  );
  const passed = total > 0 && correctCount / total >= MASTERY_PASS_RATIO;
  const alreadyMastered = isMastered(state, concept.slug);
  const allAnswered = Object.keys(answers).length === total;

  const handleSubmit = () => {
    setSubmitted(true);
    recordMcqResult(
      concept.slug,
      correctCount,
      total,
      concept.cards.map((card) => card.front)
    );
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const handleShare = async () => {
    const href = buildChallengeHref(concept.slug, correctCount, total);
    const shareData = {
      title: `Quiz: ${concept.title}`,
      text: `I scored ${correctCount}/${total} on "${concept.title}". Beat it:`,
      url: href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(href);
    setShareLabel("Link copied!");
  };

  if (total === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby={`${groupId}-heading`}
      className="my-12 rounded-md border border-border bg-card px-6 py-6"
      id="test-yourself"
    >
      <div className="mb-1 font-medium font-mono text-[10.5px] text-[var(--article-accent)] uppercase tracking-[0.22em]">
        Test yourself
      </div>
      <h2
        className="m-0 font-display font-normal text-[clamp(20px,3vw,26px)] text-foreground tracking-[-0.02em]"
        id={`${groupId}-heading`}
      >
        {concept.title}
        {alreadyMastered && (
          <span className="ml-3 align-middle font-mono text-[11px] text-brand uppercase tracking-[0.12em]">
            ✓ mastered
          </span>
        )}
      </h2>

      {challenge && (
        <p className="mt-3 rounded-sm border border-brand/40 bg-brand/5 px-3 py-2 font-body text-[14px] text-muted-foreground">
          A friend scored{" "}
          <strong className="text-foreground">
            {challenge.score}/{challenge.total}
          </strong>{" "}
          here. Can you beat it?
        </p>
      )}

      <ol className="m-0 mt-6 flex list-none flex-col gap-7 p-0">
        {concept.mcq.map((question, qIndex) => {
          const selected = answers[qIndex];
          return (
            <li key={question.q}>
              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-3 font-display font-medium text-[16px] text-foreground leading-snug">
                  {qIndex + 1}. {question.q}
                </legend>
                <div className="flex flex-col gap-2">
                  {question.choices.map((choice, cIndex) => {
                    const isChosen = selected === cIndex;
                    const isAnswer = question.answerIdx === cIndex;
                    const showRight = submitted && isAnswer;
                    const showWrong = submitted && isChosen && !isAnswer;
                    return (
                      <label
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-sm border px-3 py-2 font-body text-[15px] transition-colors",
                          !submitted && "border-border hover:border-brand/50",
                          !submitted && isChosen && "border-brand bg-brand/5",
                          showRight &&
                            "border-emerald-500/60 bg-emerald-500/10 text-foreground",
                          showWrong &&
                            "border-red-500/60 bg-red-500/10 text-foreground",
                          submitted &&
                            !(showRight || showWrong) &&
                            "border-border text-muted-foreground"
                        )}
                        key={choice}
                      >
                        <input
                          checked={isChosen}
                          className="mt-1 accent-brand"
                          disabled={submitted}
                          name={`${groupId}-q${qIndex}`}
                          onChange={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [qIndex]: cIndex,
                            }))
                          }
                          type="radio"
                          value={cIndex}
                        />
                        <span>{choice}</span>
                      </label>
                    );
                  })}
                </div>
                {submitted && (
                  <p className="mt-2 border-[var(--article-accent)] border-l-2 pl-3 font-body text-[14px] text-muted-foreground italic leading-[1.5]">
                    {question.explanation}
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      {submitted ? (
        <div className="mt-7 border-border border-t pt-5">
          <p className="m-0 font-display text-[18px] text-foreground">
            You scored{" "}
            <strong>
              {correctCount}/{total}
            </strong>
            {passed ? " — concept mastered." : " — review and try again."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={handleReset} size="sm" variant="outline">
              Try again
            </Button>
            <Button onClick={handleShare} size="sm" variant="outline">
              {shareLabel}
            </Button>
            {passed && (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link href="/review">Review flashcards</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/learn/${concept.domain}`}>Open skill tree</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-7 border-border border-t pt-5">
          <Button disabled={!allAnswered} onClick={handleSubmit} size="sm">
            {allAnswered ? "Check answers" : `Answer all ${total} to continue`}
          </Button>
        </div>
      )}
    </section>
  );
}
