import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { formatDateShort } from "@/utils/time";

import { ArticlesTable } from "../../articles-table";
import {
  getSectionArticles,
  resolveTagSection,
  TAG_SECTIONS,
} from "../../tag-sections";

const SECTION_PREFIX: Record<string, string> = {
  concept: "C",
  entity: "E",
  essay: "S",
  index: "I",
};

interface TagPageParams {
  tag: string;
}

interface TagPageProps {
  params: Promise<TagPageParams>;
}

export const dynamic = "error";
export const dynamicParams = false;

export function generateStaticParams(): TagPageParams[] {
  return TAG_SECTIONS.map((section) => ({ tag: section.slug }));
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const section = resolveTagSection(tag);
  if (!section) {
    return { title: "Not found — Howardism" };
  }
  return {
    title: `${section.title} articles — Howardism`,
    description: section.metaDescription,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const section = resolveTagSection(tag);
  if (!section) {
    notFound();
  }

  const articles = await getSectionArticles(section);
  const newestDate = articles.at(0)?.meta.date;
  const oldestDate = articles.at(-1)?.meta.date;

  return (
    <div className="hw-page-enter mx-auto max-w-[1120px] px-8 pb-20">
      <DiscPageHeader
        data={[
          ["Pieces", String(articles.length)],
          ["Section", section.title],
          ["Oldest", oldestDate ? formatDateShort(oldestDate) : "—"],
          ["Newest", newestDate ? formatDateShort(newestDate) : "—"],
        ]}
        number="02"
        plate="Plate II"
        title={`${section.title},`}
        titleAccent="filed."
        volume="Howardism · Vol. 03"
      />

      <p className="mt-10 mb-12 max-w-[60ch] font-body text-[15px] text-muted-foreground leading-[1.6]">
        {section.intro}
      </p>

      <ArticlesTable
        articles={articles}
        numberPrefix={SECTION_PREFIX[section.slug] ?? ""}
        srCaption={`${section.title} articles, sorted by date, newest first.`}
      />
    </div>
  );
}
