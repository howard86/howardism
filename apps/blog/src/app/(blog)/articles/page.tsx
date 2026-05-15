import Link from "next/link";

import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { formatDateShort } from "@/utils/time";

import { ArticlesIndex } from "./articles-index";
import { getTagCounts, getVisibleArticles } from "./service";
import { getSectionArticles, TAG_SECTIONS } from "./tag-sections";

const SECTION_PREFIX: Record<string, string> = {
  concept: "C",
  entity: "E",
  essay: "S",
};

const SECTION_BLURB: Record<string, string> = {
  concept: "Concept, in order.",
  entity: "Entity, in order.",
  essay: "Essay, in order.",
};

export default async function ArticlesIndexPage() {
  const [counts, visible, sections] = await Promise.all([
    getTagCounts(),
    getVisibleArticles(),
    Promise.all(
      TAG_SECTIONS.map(async (section) => ({
        section,
        articles: await getSectionArticles(section),
      }))
    ),
  ]);

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  // Index/Changelog is promoted into the masthead — drop it from the
  // body section list so a single-item "Index" section doesn't sit at
  // the bottom looking orphaned.
  const indexSection = sections.find(({ section }) => section.slug === "index");
  const indexOperationsLog = indexSection?.articles[0];
  const bodySections = sections
    .filter(
      ({ section, articles }) => section.slug !== "index" && articles.length > 0
    )
    .map(({ section, articles }) => ({
      sectionSlug: section.slug,
      title: section.title,
      blurb: SECTION_BLURB[section.slug] ?? section.intro,
      prefix: SECTION_PREFIX[section.slug] ?? "",
      srCaption: `${section.title} articles, sorted by date, newest first.`,
      articles: articles.map((article) => ({
        slug: article.slug,
        meta: article.meta,
      })),
    }));

  const newestSlug = visible.ids[0];
  const oldestSlug = visible.ids.at(-1);
  const newestDate = newestSlug
    ? visible.entities[newestSlug]?.meta.date
    : undefined;
  const oldestDate = oldestSlug
    ? visible.entities[oldestSlug]?.meta.date
    : undefined;

  return (
    <div className="hw-page-enter mx-auto max-w-[1120px] px-8 pb-20">
      <DiscPageHeader
        data={[
          ["Pieces", String(total)],
          ["Sections", String(bodySections.length)],
          ["Oldest", oldestDate ? formatDateShort(oldestDate) : "—"],
          ["Newest", newestDate ? formatDateShort(newestDate) : "—"],
        ]}
        number="02"
        plate="Plate II"
        title="Writing,"
        titleAccent="in order."
        volume="Howardism · Vol. 03"
      >
        {indexOperationsLog && (
          <div className="mt-7">
            <Link
              className="inline-flex items-center gap-2 font-medium font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.18em] no-underline transition-colors hover:text-brand"
              href={`/articles/${indexOperationsLog.slug}`}
            >
              <span aria-hidden="true" className="h-px w-[18px] bg-brand" />
              Changelog · Operations Log
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </DiscPageHeader>

      <ArticlesIndex sections={bodySections} />
    </div>
  );
}
