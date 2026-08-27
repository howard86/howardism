import type { Metadata } from "next";

import { env } from "@/config/env";
import { PlatePage } from "../_shell/plate-page";
import { getAllQuizConcepts } from "../articles/service";
import { ReviewSession } from "./review-session";

const REVIEW_URL = `${env.NEXT_PUBLIC_DOMAIN_NAME}/review`;

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Spaced review — Howardism",
  description:
    "Spaced-repetition flashcards for every concept you've mastered in the Howardism wiki. Review on schedule to keep what you've learned.",
  alternates: { canonical: REVIEW_URL },
  openGraph: { url: REVIEW_URL },
};

export default function ReviewPage() {
  const concepts = getAllQuizConcepts();

  return (
    <PlatePage
      headerChildren={
        <p className="mt-6 max-w-[680px] font-body text-[clamp(16px,2.2vw,18px)] text-muted-foreground leading-[1.55]">
          Active recall keeps a concept; spacing keeps it for good. Cards arrive
          when you master a concept&apos;s quiz, then return on an SM-2
          schedule.
        </p>
      }
      plate="review"
      title="Spaced review,"
      titleAccent="on schedule."
      width="read"
    >
      <ReviewSession concepts={concepts} />
    </PlatePage>
  );
}
