import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { formatDateShort } from "@/utils/time";

import { ArticlesTable } from "./articles-table";
import { getTagCounts, getVisibleArticles } from "./service";
import { getSectionArticles, TAG_SECTIONS } from "./tag-sections";

export default async function ArticlesIndex() {
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

  const populated = sections.filter(({ articles }) => articles.length > 0);

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
          ["Sections", String(populated.length)],
          ["Oldest", oldestDate ? formatDateShort(oldestDate) : "—"],
          ["Newest", newestDate ? formatDateShort(newestDate) : "—"],
        ]}
        number="02"
        plate="Plate II"
        title="Writing,"
        titleAccent="in order."
        volume="Howardism · Vol. 03"
      />

      <p className="mt-10 mb-12 max-w-[60ch] font-body text-[15px] text-muted-foreground leading-[1.6]">
        A dense index of every article in the wiki, grouped by kind. Hover any
        title for a preview, click to read.
      </p>

      <div className="flex flex-col gap-14">
        {populated.map(({ section, articles }) => (
          <ArticlesTable
            articles={articles}
            key={section.slug}
            srCaption={`${section.title} articles, sorted by date, newest first.`}
            title={section.title}
          />
        ))}
      </div>
    </div>
  );
}
