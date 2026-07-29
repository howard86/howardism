import type { Metadata } from "next";

import { env } from "@/config/env";

import { PlatePage } from "../_shell/plate-page";
import { getOpenQuestions } from "../articles/service";
import { QuestionsWorklist } from "./questions-worklist";

const QUESTIONS_URL = `${env.NEXT_PUBLIC_DOMAIN_NAME}/questions`;

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Open Questions — Howardism",
  description:
    "The live worklist: unanswered questions harvested from every concept in the Howardism wiki, searchable and filterable by triage and domain.",
  alternates: { canonical: QUESTIONS_URL },
  openGraph: { url: QUESTIONS_URL },
};

export default function QuestionsPage() {
  const concepts = getOpenQuestions();
  const open = concepts.reduce((sum, c) => sum + c.questions.length, 0);
  const resolved = concepts.reduce((sum, c) => sum + c.resolved.length, 0);
  const domains = new Set(concepts.map((c) => c.domain));

  return (
    <PlatePage
      headerChildren={
        <p className="mt-6 max-w-[680px] font-body text-[clamp(16px,2.2vw,18px)] text-muted-foreground leading-[1.55]">
          The live worklist, harvested from the wiki&apos;s concept notes.
          Search it, narrow it to one domain, or pull out only the questions the
          vault thinks are answerable today — the tally moves with whatever you
          type. Each line links back to the note that raised it.
        </p>
      }
      headerData={[
        ["Open", String(open)],
        ["Resolved", String(resolved)],
        ["Concepts", String(concepts.length)],
        ["Domains", String(domains.size)],
      ]}
      plate="questions"
      title="Open questions,"
      titleAccent="unresolved."
      width="wide"
    >
      <QuestionsWorklist concepts={concepts} />
    </PlatePage>
  );
}
