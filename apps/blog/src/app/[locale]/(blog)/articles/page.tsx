import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { env } from "@/config/env";
import { formatDate, formatDateShort } from "@/utils/time";

import { FilterBar } from "./filter-bar";
import { KindPlate } from "./kind-plate";
import { OperationsLog } from "./operations-log";
import { getTranslatedArticleLinks } from "./render-article";
import {
  type ArticleTopic,
  getNavigableTagSet,
  getTagCounts,
  getTagIndex,
  getVisibleArticles,
  getWikiLog,
} from "./service";
import { TagIndex } from "./tag-index";
import { getSectionArticles, TAG_SECTIONS } from "./tag-sections";

const OPS_LOG_LIMIT = 14;

const VISIBLE_BY_SLUG: Record<string, number> = {
  concept: 12,
  entity: 10,
  essay: 8,
  index: 8,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const baseUrl = env.NEXT_PUBLIC_DOMAIN_NAME;
  if (locale === "zh-TW") {
    const t = await getTranslations("Articles");
    const url = `${baseUrl}/zh-TW/articles`;
    return {
      title: t("zhTitle"),
      description: t("zhDescription"),
      alternates: {
        canonical: url,
        languages: {
          en: `${baseUrl}/articles`,
          "zh-TW": url,
          "x-default": `${baseUrl}/articles`,
        },
      },
      openGraph: { url, locale: "zh_TW" },
    };
  }
  const url = `${baseUrl}/articles`;
  return {
    alternates: {
      canonical: url,
      languages: {
        en: url,
        "zh-TW": `${baseUrl}/zh-TW/articles`,
        "x-default": url,
      },
    },
    openGraph: { url },
  };
}

async function ZhArticlesIndex() {
  const t = await getTranslations("Articles");
  const links = await getTranslatedArticleLinks();
  return (
    <div className="hw-page-enter mx-auto max-w-[720px] px-4 py-16">
      <header className="mb-10 border-border border-b pb-6">
        <p className="font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.22em]">
          {t("machineTranslatedLabel")}
        </p>
        <h1 className="mt-3 font-display font-normal text-[27px] text-foreground leading-[1.25]">
          {t("zhTitle")}
        </h1>
        <p className="mt-2 font-body text-muted-foreground text-sm">
          {t("zhIntro")}
          <Link
            className="ml-1 underline hover:text-[var(--brand)]"
            href="/articles"
          >
            {t("viewEnglish")}
          </Link>
        </p>
      </header>

      <ul className="flex flex-col divide-y divide-border">
        {links.map((article) => (
          <li className="py-5" key={article.slug}>
            <Link
              className="group block no-underline"
              href={`/zh-TW/articles/${article.slug}`}
            >
              <span className="font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.18em]">
                {formatDate(article.date)}
              </span>
              <h2 className="mt-1 font-display text-[18px] text-foreground leading-[1.3] transition-colors group-hover:text-[var(--brand)]">
                {article.title}
              </h2>
              <p className="mt-1 font-body text-muted-foreground text-sm leading-[1.6]">
                {article.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ArticlesIndex() {
  const locale = await getLocale();
  if (locale === "zh-TW") {
    return <ZhArticlesIndex />;
  }

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

      <TagIndex tags={tagIndex} />

      <OperationsLog
        entries={getWikiLog(OPS_LOG_LIMIT)}
        slugTopics={slugTopics}
      />
    </div>
  );
}
