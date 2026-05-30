import type { Metadata } from "next";

import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { env } from "@/config/env";

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
  const total = concepts.reduce((sum, c) => sum + c.questions.length, 0);

  const byDomain = DOMAIN_ORDER.map((domain) => ({
    domain,
    concepts: concepts.filter((c) => c.domain === domain),
  })).filter((group) => group.concepts.length > 0);

  return (
    <div className="hw-page-enter mx-auto max-w-[1120px] px-8 pb-20">
      <DiscPageHeader
        data={[
          ["Questions", String(total)],
          ["Concepts", String(concepts.length)],
          ["Domains", String(byDomain.length)],
        ]}
        number="03"
        plate="Plate III"
        title="Open questions,"
        titleAccent="unresolved."
        volume="Howardism · Vol. 03"
      >
        <p className="mt-6 max-w-[680px] font-body text-[clamp(16px,2.2vw,18px)] text-muted-foreground leading-[1.55]">
          The live worklist. Every unanswered question harvested from the
          wiki&apos;s concept notes, grouped by domain. Each links back to the
          note that raised it.
        </p>
      </DiscPageHeader>

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
    </div>
  );
}
