import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { env } from "@/config/env";
import { humanizeTag } from "@/utils/humanize-tag";
import { taggedHref } from "@/utils/tagged-href";
import { formatDateShort } from "@/utils/time";

import { ArticlesTable } from "../../articles-table";
import { getNavigableTags, getTaggedArticles } from "../../service";

interface TaggedPageParams {
  tag: string;
}

interface TaggedPageProps {
  params: Promise<TaggedPageParams>;
}

export const dynamic = "error";
export const dynamicParams = false;

export async function generateStaticParams(): Promise<TaggedPageParams[]> {
  const tags = await getNavigableTags();
  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: TaggedPageProps): Promise<Metadata> {
  const { tag } = await params;
  const navigable = await getNavigableTags();
  if (!navigable.includes(tag)) {
    return { title: "Not found — Howardism" };
  }
  const label = humanizeTag(tag);
  const url = `${env.NEXT_PUBLIC_DOMAIN_NAME}${taggedHref(tag)}`;
  return {
    title: `${label} — Howardism`,
    description: `Articles tagged ${label} from the Howardism wiki.`,
    alternates: { canonical: url },
    openGraph: { url },
  };
}

export default async function TaggedPage({ params }: TaggedPageProps) {
  const { tag } = await params;
  const navigable = await getNavigableTags();
  if (!navigable.includes(tag)) {
    notFound();
  }

  const label = humanizeTag(tag);
  const articles = await getTaggedArticles(tag);
  const newestDate = articles.at(0)?.meta.date;
  const oldestDate = articles.at(-1)?.meta.date;

  return (
    <div className="hw-page-enter mx-auto max-w-[1120px] px-8 pb-20">
      <DiscPageHeader
        data={[
          ["Notes", String(articles.length)],
          ["Tag", label],
          ["Oldest", oldestDate ? formatDateShort(oldestDate) : "—"],
          ["Newest", newestDate ? formatDateShort(newestDate) : "—"],
        ]}
        number="02"
        plate="Plate II"
        title={`${label},`}
        titleAccent="tagged."
        volume="Howardism · Vol. 03"
      />

      <p className="mt-10 mb-12 max-w-[60ch] font-body text-[15px] text-muted-foreground leading-[1.6]">
        Every article tagged <em>{label.toLowerCase()}</em>, newest first.
      </p>

      <ArticlesTable
        articles={articles}
        srCaption={`Articles tagged ${label}, sorted by date, newest first.`}
      />
    </div>
  );
}
