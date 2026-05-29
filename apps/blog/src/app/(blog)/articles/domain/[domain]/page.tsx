import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { env } from "@/config/env";
import { formatDateShort } from "@/utils/time";

import { ArticlesTable } from "../../articles-table";
import { DOMAIN_META, DOMAIN_ORDER, resolveDomain } from "../../domain-meta";
import { OpenQuestionsSection } from "../../open-questions-section";
import { getArticlesByDomain, getOpenQuestionsByDomain } from "../../service";

interface DomainPageParams {
  domain: string;
}

interface DomainPageProps {
  params: Promise<DomainPageParams>;
}

export const dynamic = "error";
export const dynamicParams = false;

export function generateStaticParams(): DomainPageParams[] {
  return DOMAIN_ORDER.map((domain) => ({ domain }));
}

export async function generateMetadata({
  params,
}: DomainPageProps): Promise<Metadata> {
  const { domain } = await params;
  const resolved = resolveDomain(domain);
  if (!resolved) {
    return { title: "Not found — Howardism" };
  }
  const meta = DOMAIN_META[resolved];
  const url = `${env.NEXT_PUBLIC_DOMAIN_NAME}/articles/domain/${resolved}`;
  return {
    title: `${meta.label} notes — Howardism`,
    description: meta.metaDescription,
    alternates: { canonical: url },
    openGraph: { url },
  };
}

export default async function DomainPage({ params }: DomainPageProps) {
  const { domain } = await params;
  const resolved = resolveDomain(domain);
  if (!resolved) {
    notFound();
  }

  const meta = DOMAIN_META[resolved];
  const [articles, openQuestions] = await Promise.all([
    getArticlesByDomain(resolved),
    Promise.resolve(getOpenQuestionsByDomain(resolved)),
  ]);
  const newestDate = articles.at(0)?.meta.date;
  const oldestDate = articles.at(-1)?.meta.date;
  const openCount = openQuestions.reduce(
    (sum, concept) => sum + concept.questions.length,
    0
  );

  return (
    <div className="hw-page-enter mx-auto max-w-[1120px] px-8 pb-20">
      <DiscPageHeader
        data={[
          ["Notes", String(articles.length)],
          ["Domain", meta.label],
          ["Open Qs", String(openCount)],
          ["Newest", newestDate ? formatDateShort(newestDate) : "—"],
          ["Oldest", oldestDate ? formatDateShort(oldestDate) : "—"],
        ]}
        number="02"
        plate="Plate II"
        title={`${meta.label},`}
        titleAccent="in order."
        volume="Howardism · Vol. 03"
      />

      <p className="mt-10 mb-12 max-w-[60ch] font-body text-[15px] text-muted-foreground leading-[1.6]">
        {meta.blurb}
      </p>

      <ArticlesTable
        articles={articles}
        srCaption={`${meta.label} articles, sorted by date, newest first.`}
      />

      <OpenQuestionsSection
        color={meta.color}
        concepts={openQuestions}
        heading="Open questions"
      />
    </div>
  );
}
