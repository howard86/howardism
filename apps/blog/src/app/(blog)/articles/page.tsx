import type { Metadata } from "next";

import { env } from "@/config/env";
import { formatDateShort } from "@/utils/time";

import { PlatePage } from "../_shell/plate-page";
import { baseOpenGraph, baseTwitter, feedAlternates } from "../shared-metadata";
import { groupArticlesByDomain } from "./domain-groups";
import { FilterBar } from "./filter-bar";
import { KindPlate } from "./kind-plate";
import {
  getNavigableTagSet,
  getTagCounts,
  getTagIndex,
  getTranslatedSlugs,
  getVisibleArticles,
} from "./service";
import { TagIndex } from "./tag-index";
import { getSectionArticles, TAG_SECTIONS } from "./tag-sections";

const ARTICLES_URL = `${env.NEXT_PUBLIC_DOMAIN_NAME}/articles`;

/** Newest-first row budget per section. */
const VISIBLE_BY_SLUG: Record<string, number> = {
  entity: 10,
  essay: 8,
  index: 8,
};

const ZH_ARTICLES_URL = `${env.NEXT_PUBLIC_DOMAIN_NAME}/zh-TW/articles`;
const hasZh = getTranslatedSlugs().length > 0;

const ARTICLES_TITLE = "Articles";
const ARTICLES_DESCRIPTION =
  "Every article in the Howardism wiki, grouped by kind: concept notes, entity profiles and essays.";

export const metadata: Metadata = {
  title: ARTICLES_TITLE,
  description: ARTICLES_DESCRIPTION,
  alternates: {
    canonical: ARTICLES_URL,
    types: feedAlternates,
    ...(hasZh && {
      languages: {
        en: ARTICLES_URL,
        "zh-TW": ZH_ARTICLES_URL,
        "x-default": ARTICLES_URL,
      },
    }),
  },
  openGraph: {
    ...baseOpenGraph,
    ...(hasZh && { alternateLocale: "zh_TW" }),
    url: ARTICLES_URL,
    title: ARTICLES_TITLE,
    description: ARTICLES_DESCRIPTION,
  },
  twitter: baseTwitter,
};

export default async function ArticlesIndex() {
  const [counts, visible, sections, navigable, tagIndex] = await Promise.all([
    getTagCounts(),
    getVisibleArticles(),
    Promise.all(
      TAG_SECTIONS.map(async (section) => ({
        section,
        articles: await getSectionArticles(section),
      }))
    ),
    getNavigableTagSet(),
    getTagIndex(),
  ]);

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const populated = sections.filter(({ articles }) => articles.length > 0);

  const newestDate = visible.entities[visible.ids[0]]?.meta.date;
  const oldestDate = visible.entities[visible.ids.at(-1) ?? ""]?.meta.date;

  return (
    <PlatePage
      bleed
      headerChildren={
        <p className="mt-6 max-w-[680px] font-body text-[clamp(16px,2.2vw,18px)] text-muted-foreground leading-[1.55]">
          Every article in the wiki, grouped by kind: <em>Concept</em> notes,{" "}
          <em>Entity</em> profiles, and <em>Essay</em> pieces. Hover any title
          for a preview; click to enter.
        </p>
      }
      headerData={[
        ["Pieces", String(total)],
        ["Sections", String(populated.length)],
        ["Oldest", oldestDate ? formatDateShort(oldestDate) : "—"],
        ["Newest", newestDate ? formatDateShort(newestDate) : "—"],
      ]}
      plate="articles"
      title="Writing,"
      titleAccent="in order."
      width="wide"
    >
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
          groups={
            section.slug === "concept"
              ? groupArticlesByDomain(articles)
              : undefined
          }
          key={section.slug}
          navigable={navigable}
          position={i + 1}
          slug={section.slug}
          title={section.title}
          total={populated.length}
          visibleLimit={VISIBLE_BY_SLUG[section.slug] ?? 10}
        />
      ))}

      <TagIndex tags={tagIndex} />
    </PlatePage>
  );
}
