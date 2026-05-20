import type { Metadata } from "next";

import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { env } from "@/config/env";
import { formatDateShort } from "@/utils/time";

import { FilterBar } from "./filter-bar";
import { KindPlate } from "./kind-plate";
import { OperationsLog } from "./operations-log";
import {
  type ArticleTopic,
  getNavigableTags,
  getTagCounts,
  getVisibleArticles,
  getWikiLog,
} from "./service";
import { getSectionArticles, TAG_SECTIONS } from "./tag-sections";

const ARTICLES_URL = `${env.NEXT_PUBLIC_DOMAIN_NAME}/articles`;
const OPS_LOG_LIMIT = 14;

/** Newest-first row budget per section. */
const VISIBLE_BY_SLUG: Record<string, number> = {
  concept: 12,
  entity: 10,
  essay: 8,
  index: 8,
};

export const metadata: Metadata = {
  alternates: { canonical: ARTICLES_URL },
  openGraph: { url: ARTICLES_URL },
};

export default async function ArticlesIndex() {
  const [counts, visible, sections, navigableTags] = await Promise.all([
    getTagCounts(),
    getVisibleArticles(),
    Promise.all(
      TAG_SECTIONS.map(async (section) => ({
        section,
        articles: await getSectionArticles(section),
      }))
    ),
    getNavigableTags(),
  ]);
  const navigable = new Set(navigableTags);

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const populated = sections.filter(({ articles }) => articles.length > 0);

  const newestDate = visible.entities[visible.ids[0]]?.meta.date;
  const oldestDate = visible.entities[visible.ids.at(-1) ?? ""]?.meta.date;

  const slugTopics: Record<string, ArticleTopic | undefined> = {};
  for (const id of visible.ids) {
    slugTopics[id] = visible.entities[id]?.meta.topic;
  }

  return (
    <div className="hw-page-enter mx-auto max-w-[1320px]">
      <div className="px-[clamp(20px,5vw,56px)]">
        <DiscPageHeader
          data={[
            ["Pieces", String(total)],
            ["Sections", String(populated.length)],
            ["Oldest", oldestDate ? formatDateShort(oldestDate) : "—"],
            ["Newest", newestDate ? formatDateShort(newestDate) : "—"],
          ]}
          number="02"
          plate="Plate II"
          title="Writing,"
          titleAccent="in order."
          volume="Howardism · Vol. 03"
        >
          <p className="mt-6 max-w-[680px] font-body text-[clamp(16px,2.2vw,18px)] text-muted-foreground leading-[1.55]">
            Every article in the wiki, grouped by kind: <em>Concept</em> notes,{" "}
            <em>Entity</em> profiles, and <em>Essay</em> pieces. Hover any title
            for a preview; click to enter.
          </p>
        </DiscPageHeader>
      </div>

      <FilterBar
        sectionSlugs={populated.map(({ section }) => ({
          slug: section.slug,
          title: section.title,
        }))}
      />

      {populated.map(({ section, articles }, i) => (
        <KindPlate
          articles={articles}
          blurb={section.intro}
          key={section.slug}
          navigable={navigable}
          position={i + 1}
          slug={section.slug}
          title={section.title}
          total={populated.length}
          visibleLimit={VISIBLE_BY_SLUG[section.slug] ?? 10}
        />
      ))}

      <OperationsLog
        entries={getWikiLog(OPS_LOG_LIMIT)}
        slugTopics={slugTopics}
      />
    </div>
  );
}
