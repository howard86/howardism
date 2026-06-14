import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "@/config/env";
import { formatDateShort } from "@/utils/time";

import { PlatePage } from "../../../_shell/plate-page";
import { ArticlesTable } from "../../articles-table";
import {
  getSectionArticles,
  resolveTagSection,
  TAG_SECTIONS,
} from "../../tag-sections";

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
  const url = `${env.NEXT_PUBLIC_DOMAIN_NAME}/articles/tag/${section.slug}`;
  return {
    title: `${section.title} articles — Howardism`,
    description: section.metaDescription,
    alternates: { canonical: url },
    openGraph: { url },
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
    <PlatePage
      headerData={[
        ["Pieces", String(articles.length)],
        ["Section", section.title],
        ["Oldest", oldestDate ? formatDateShort(oldestDate) : "—"],
        ["Newest", newestDate ? formatDateShort(newestDate) : "—"],
      ]}
      plate="articles"
      title={`${section.title},`}
      titleAccent="filed."
      width="index"
    >
      <p className="mt-10 mb-12 max-w-[60ch] font-body text-[15px] text-muted-foreground leading-[1.6]">
        {section.intro}
      </p>

      <ArticlesTable
        articles={articles}
        srCaption={`${section.title} articles, sorted by date, newest first.`}
      />
    </PlatePage>
  );
}
