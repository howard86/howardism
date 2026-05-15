"use client";

import { cn } from "@howardism/ui/lib/utils";
import { useMemo, useState } from "react";

import { formatDateShort } from "@/utils/time";

import { ArticlesTable } from "./articles-table";
import type { ArticleMeta } from "./service";
import type { ArticleTopic } from "./taxonomy";
import { ARTICLE_TOPICS } from "./taxonomy";

interface ArticleRow {
  meta: ArticleMeta;
  slug: string;
}

interface SectionView {
  articles: ArticleRow[];
  blurb: string;
  prefix: string;
  sectionSlug: string;
  srCaption: string;
  title: string;
}

interface ArticlesIndexProps {
  sections: SectionView[];
}

type TagFilter = "all" | string;
type TopicFilter = "all" | ArticleTopic;

const TOPIC_LABEL: Record<ArticleTopic, string> = {
  interaction: "interaction",
  alignment: "alignment",
  harness: "harness",
  product: "product",
  org: "org",
};

const ACTIVE_CLASS =
  "italic text-brand underline underline-offset-[6px] decoration-brand/60";
const INACTIVE_CLASS =
  "text-foreground-subtle hover:text-foreground transition-colors";

function formatRange(oldest?: string, newest?: string): string | null {
  if (!newest) {
    return null;
  }
  if (!oldest || oldest === newest) {
    return formatDateShort(newest);
  }
  return `${formatDateShort(oldest)} → ${formatDateShort(newest)}`;
}

export function ArticlesIndex({ sections }: ArticlesIndexProps) {
  const [tagFilter, setTagFilter] = useState<TagFilter>("all");
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("all");

  const tagOptions = useMemo<TagFilter[]>(
    () => ["all", ...sections.map((s) => s.sectionSlug)],
    [sections]
  );

  const topicOptions = useMemo<TopicFilter[]>(
    () => ["all", ...ARTICLE_TOPICS],
    []
  );

  const filteredSections = useMemo(
    () =>
      sections
        .filter(
          (section) => tagFilter === "all" || section.sectionSlug === tagFilter
        )
        .map((section) => ({
          ...section,
          articles:
            topicFilter === "all"
              ? section.articles
              : section.articles.filter(
                  (article) => article.meta.topic === topicFilter
                ),
        }))
        .filter((section) => section.articles.length > 0),
    [sections, tagFilter, topicFilter]
  );

  return (
    <>
      <p className="mt-10 mb-6 max-w-[60ch] font-body text-[15px] text-muted-foreground leading-[1.6]">
        A dense index of every article in the wiki, grouped by kind. Hover any
        title for a preview, click to read.
      </p>
      <div className="mb-12 flex flex-col gap-3 border-foreground border-y border-dashed py-4 font-mono text-[11px] uppercase tracking-[0.14em]">
        <FilterRow
          activeValue={tagFilter}
          label="Filed under"
          onChange={setTagFilter}
          options={tagOptions}
        />
        <FilterRow
          activeValue={topicFilter}
          label="Topic"
          onChange={(value) => setTopicFilter(value as TopicFilter)}
          options={topicOptions}
          renderLabel={(value) =>
            value === "all" ? "all" : TOPIC_LABEL[value as ArticleTopic]
          }
        />
      </div>

      {filteredSections.length === 0 ? (
        <p className="font-body text-[14px] text-muted-foreground italic">
          No pieces match this filter.
        </p>
      ) : (
        <div className="flex flex-col gap-16">
          {filteredSections.map((section, index) => {
            const sectionNumber = String(index + 1);
            const newest = section.articles[0]?.meta.date;
            const oldest = section.articles.at(-1)?.meta.date;
            const dateRange = formatRange(oldest, newest);

            return (
              <section key={section.sectionSlug}>
                <header className="mb-6 border-foreground border-b-[1.5px] pb-3">
                  <div className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.18em]">
                    <span>§02·{sectionNumber} · </span>
                    <span className="text-foreground">{section.title}</span>
                    <span> · {section.articles.length}</span>
                    {dateRange ? <span> · {dateRange}</span> : null}
                  </div>
                  <h2 className="mt-3 mb-0 font-display font-normal text-[28px] text-foreground leading-[1.1] tracking-[-0.02em]">
                    {section.title},{" "}
                    <em className="text-brand italic">in order.</em>
                  </h2>
                  <span className="sr-only">{section.blurb}</span>
                </header>
                <ArticlesTable
                  articles={section.articles}
                  numberPrefix={section.prefix}
                  srCaption={section.srCaption}
                />
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

interface FilterRowProps<T extends string> {
  activeValue: T;
  label: string;
  onChange: (value: T) => void;
  options: T[];
  renderLabel?: (value: T) => string;
}

function FilterRow<T extends string>({
  activeValue,
  label,
  onChange,
  options,
  renderLabel,
}: FilterRowProps<T>) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-foreground-subtle">{label}:</span>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {options.map((option, idx) => {
          const isActive = option === activeValue;
          const isLast = idx === options.length - 1;
          return (
            <span className="inline-flex items-baseline gap-3" key={option}>
              <button
                aria-pressed={isActive}
                className={cn(
                  "appearance-none bg-transparent p-0 font-mono text-[11px] uppercase tracking-[0.14em]",
                  isActive ? ACTIVE_CLASS : INACTIVE_CLASS
                )}
                onClick={() => onChange(option)}
                type="button"
              >
                {renderLabel ? renderLabel(option) : option}
              </button>
              {isLast ? null : (
                <span aria-hidden="true" className="text-foreground-subtle/40">
                  ·
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
