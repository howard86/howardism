import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { env } from "@/config/env";
import { formatDateShort } from "@/utils/time";

import { ArticlesTable } from "../../articles-table";
import { getArticlesByTopic } from "../../service";
import { resolveTopic, TOPIC_META, TOPIC_ORDER } from "../../topic-meta";

interface TopicPageParams {
  topic: string;
}

interface TopicPageProps {
  params: Promise<TopicPageParams>;
}

export const dynamic = "error";
export const dynamicParams = false;

export function generateStaticParams(): TopicPageParams[] {
  return TOPIC_ORDER.map((topic) => ({ topic }));
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const { topic } = await params;
  const resolved = resolveTopic(topic);
  if (!resolved) {
    return { title: "Not found — Howardism" };
  }
  const meta = TOPIC_META[resolved];
  const url = `${env.NEXT_PUBLIC_DOMAIN_NAME}/articles/topic/${resolved}`;
  return {
    title: `${meta.label} notes — Howardism`,
    description: meta.metaDescription,
    alternates: { canonical: url },
    openGraph: { url },
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { topic } = await params;
  const resolved = resolveTopic(topic);
  if (!resolved) {
    notFound();
  }

  const meta = TOPIC_META[resolved];
  const articles = await getArticlesByTopic(resolved);
  const newestDate = articles.at(0)?.meta.date;
  const oldestDate = articles.at(-1)?.meta.date;

  return (
    <div className="hw-page-enter mx-auto max-w-[1120px] px-8 pb-20">
      <DiscPageHeader
        data={[
          ["Notes", String(articles.length)],
          ["Topic", meta.label],
          ["Oldest", oldestDate ? formatDateShort(oldestDate) : "—"],
          ["Newest", newestDate ? formatDateShort(newestDate) : "—"],
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
    </div>
  );
}
