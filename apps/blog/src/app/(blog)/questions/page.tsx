import type { Metadata } from "next";

import { env } from "@/config/env";

import { PlatePage } from "../_shell/plate-page";
import { DOMAIN_META, DOMAIN_ORDER } from "../articles/domain-meta";
import { OpenQuestionsSection } from "../articles/open-questions-section";
import { getOpenQuestions } from "../articles/service";

const QUESTIONS_URL = `${env.NEXT_PUBLIC_DOMAIN_NAME}/questions`;

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Open Questions — Howardism",
  description:
    "The live worklist: unanswered questions harvested from every concept in the Howardism wiki, grouped by domain.",
  alternates: { canonical: QUESTIONS_URL },
  openGraph: { url: QUESTIONS_URL },
};

export default function QuestionsPage() {
  const concepts = getOpenQuestions();
  const questions = concepts.flatMap((c) => c.questions);

  // The vault's own triage, carried through by the importer. Reporting one
  // undifferentiated total implies every entry is equally live, when most are
  // parked waiting on evidence that does not exist yet.
  //
  // A manifest emitted before the importer carried the tag has no triage at
  // all; fall back to the plain total there rather than claiming nothing is
  // answerable. The breakdown appears on the next `bun run import:wiki`.
  const triaged = questions.some((q) => q.kind !== null);
  const answerable = questions.filter((q) => q.kind === "now").length;
  const resolved = concepts.reduce((sum, c) => sum + c.resolved.length, 0);

  const byDomain = DOMAIN_ORDER.map((domain) => ({
    domain,
    concepts: concepts.filter((c) => c.domain === domain),
  })).filter((group) => group.concepts.length > 0);

  const headerData: [string, string][] = triaged
    ? [
        ["Answerable now", String(answerable)],
        ["Awaiting evidence", String(questions.length - answerable)],
        ["Resolved", String(resolved)],
        ["Concepts", String(concepts.length)],
      ]
    : [
        ["Questions", String(questions.length)],
        ["Concepts", String(concepts.length)],
        ["Domains", String(byDomain.length)],
      ];

  return (
    <PlatePage
      headerChildren={
        <p className="mt-6 max-w-[680px] font-body text-[clamp(16px,2.2vw,18px)] text-muted-foreground leading-[1.55]">
          The live worklist, harvested from the wiki&apos;s concept notes and
          grouped by domain. Most entries are parked until the evidence exists;
          the ones already settled are marked resolved. Each links back to the
          note that raised it.
        </p>
      }
      headerData={headerData}
      plate="questions"
      title="Open questions,"
      titleAccent="unresolved."
      width="wide"
    >
      <div className="mt-4">
        {byDomain.map(({ domain, concepts: group }) => (
          <OpenQuestionsSection
            color={DOMAIN_META[domain].color}
            concepts={group}
            heading={DOMAIN_META[domain].label}
            key={domain}
          />
        ))}
      </div>
    </PlatePage>
  );
}
