import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "@/config/env";
import { PlatePage } from "../../_shell/plate-page";
import { DOMAIN_META, resolveDomain } from "../../articles/domain-meta";
import { getQuizByDomain, getQuizDomains } from "../../articles/service";
import { SkillTree } from "./skill-tree";

interface LearnDomainPageProps {
  params: Promise<{ domain: string }>;
}

export function generateStaticParams(): { domain: string }[] {
  return getQuizDomains().map((domain) => ({ domain }));
}

export async function generateMetadata({
  params,
}: LearnDomainPageProps): Promise<Metadata> {
  const { domain: raw } = await params;
  const domain = resolveDomain(raw);
  if (!domain) {
    return {};
  }
  const meta = DOMAIN_META[domain];
  const url = `${env.NEXT_PUBLIC_DOMAIN_NAME}/learn/${domain}`;
  return {
    title: `Learn ${meta.label} — Howardism`,
    description: `Active-recall skill tree for ${meta.label}: pass the quiz on each concept to master it and unlock the rest of the domain.`,
    alternates: { canonical: url },
    openGraph: { url },
  };
}

export default async function LearnDomainPage({
  params,
}: LearnDomainPageProps) {
  const { domain: raw } = await params;
  const domain = resolveDomain(raw);
  if (!domain) {
    notFound();
  }
  const concepts = getQuizByDomain(domain);
  if (concepts.length === 0) {
    notFound();
  }
  const meta = DOMAIN_META[domain];
  const hubCount = concepts.filter((concept) => concept.isHub).length;

  return (
    <PlatePage
      headerChildren={
        <p className="mt-6 max-w-[680px] font-body text-[clamp(16px,2.2vw,18px)] text-muted-foreground leading-[1.55]">
          {meta.blurb} Pass a concept&apos;s quiz to master it; clear the hub
          concepts to unlock the rest of the domain. Reading is always open —
          only mastery is earned.
        </p>
      }
      headerData={[
        ["Concepts", String(concepts.length)],
        ["Hubs", String(hubCount)],
      ]}
      plate="learn"
      title={`${meta.label},`}
      titleAccent="drilled."
      width="index"
    >
      <SkillTree color={meta.color} concepts={concepts} />
    </PlatePage>
  );
}
