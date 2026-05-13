import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { formatDateShort } from "@/utils/time";

import { ArticlesIndexClient } from "./articles-index-client";
import { getArticles } from "./service";

export default async function ArticlesIndex() {
  const articles = await getArticles();

  const articleList = articles.ids
    .map((slug) => articles.entities[slug])
    .filter((a): a is NonNullable<typeof a> => a !== undefined);

  const newest = articleList.at(0);
  const oldest = articleList.at(-1);

  return (
    <div className="hw-page-enter mx-auto max-w-[1120px] px-8 pb-20">
      <DiscPageHeader
        data={[
          ["Pieces", String(articleList.length)],
          ["Oldest", oldest ? formatDateShort(oldest.meta.date) : "—"],
          ["Newest", newest ? formatDateShort(newest.meta.date) : "—"],
          ["Pace", "Monthly, ish"],
        ]}
        number="02"
        plate="Plate II"
        title="Writing,"
        titleAccent="in order."
        volume="Howardism · Vol. 03"
      />

      <ArticlesIndexClient articles={articleList} />
    </div>
  );
}
