import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "@/config/env";
import { formatDateShort } from "@/utils/time";

import { PlatePage } from "../../../_shell/plate-page";
import { ArticlesTable } from "../../articles-table";
import { DOMAIN_META, DOMAIN_ORDER, resolveDomain } from "../../domain-meta";
import { OpenQuestionsSection } from "../../open-questions-section";
import { importArticleModule } from "../../render-article";
import {
  articleExists,
  getArticlesByDomain,
  getNavigableTagSet,
  getOpenQuestionsByDomain,
} from "../../service";

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
  const mocSlug = `moc-${resolved}`;
  const [articles, openQuestions, hasMoc, navigable] = await Promise.all([
    getArticlesByDomain(resolved),
    Promise.resolve(getOpenQuestionsByDomain(resolved)),
    articleExists(mocSlug),
    getNavigableTagSet(),
  ]);
  // Render the curated Map of Content inline when one exists; the `syntheses`
  // domain has no MOC, so it falls back to the date-sorted notes table.
  const Moc = hasMoc
    ? (await importArticleModule(mocSlug, "en")).default
    : null;
  const newestDate = articles.at(0)?.meta.date;
  const oldestDate = articles.at(-1)?.meta.date;
  const openCount = openQuestions.reduce(
    (sum, concept) => sum + concept.questions.length,
    0
  );

  return (
    <PlatePage
      headerData={[
        ["Notes", String(articles.length)],
        ["Domain", meta.label],
        ["Open Qs", String(openCount)],
        ["Newest", newestDate ? formatDateShort(newestDate) : "—"],
        ["Oldest", oldestDate ? formatDateShort(oldestDate) : "—"],
      ]}
      plate="domains"
      title={`${meta.label},`}
      titleAccent="in order."
      width="index"
    >
      <p className="mt-10 mb-12 max-w-[60ch] font-body text-[15px] text-muted-foreground leading-[1.6]">
        {meta.blurb}
      </p>

      {Moc ? (
        <div className="prose max-w-none">
          <Moc />
        </div>
      ) : (
        <ArticlesTable
          accent={meta.color}
          articles={articles}
          navigable={navigable}
          showDomain={false}
          srCaption={`${meta.label} articles, sorted by date, newest first.`}
        />
      )}

      <OpenQuestionsSection
        color={meta.color}
        concepts={openQuestions}
        heading="Open questions"
      />
    </PlatePage>
  );
}
