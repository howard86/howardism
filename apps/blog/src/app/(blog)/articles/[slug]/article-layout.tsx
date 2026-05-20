import { Card } from "@howardism/ui/components/card";
import { cn } from "@howardism/ui/lib/utils";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { DataGrid } from "@/components/howardism/data-grid";
import { HalfDisc } from "@/components/howardism/half-disc";
import { TopicLabel } from "@/components/howardism/topic-label";
import { formatDate } from "@/utils/time";

import type { ArticleHeading, ArticleMeta } from "../service";
import { TOPIC_META } from "../topic-meta";
import { ArticleRail } from "./article-rail";
import { BacklinksDisclosure } from "./backlinks-disclosure";

interface ArticleLayoutProps {
  children?: ReactNode;
  headings?: ArticleHeading[];
  heroImage?: StaticImageData;
  meta: ArticleMeta;
  nextSlug?: string;
  nextTitle?: string;
  previousSlug?: string;
  previousTitle?: string;
  slug: string;
}

const EYEBROW_CLASS =
  "font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.22em]";
const NAV_KICKER_CLASS =
  "font-mono text-[10.5px] text-[var(--article-accent)] uppercase tracking-[0.22em]";
const NAV_TITLE_CLASS =
  "font-display text-[15px] text-foreground leading-[1.25] transition-colors group-hover:text-[var(--article-accent)]";

export function ArticleLayout({
  children,
  headings = [],
  heroImage,
  meta,
  previousSlug,
  previousTitle,
  nextSlug,
  nextTitle,
  slug,
}: ArticleLayoutProps) {
  const accent = meta.topic ? TOPIC_META[meta.topic].color : "var(--brand)";
  const topicRow: [string, ReactNode] | null = meta.topic
    ? ["Topic", <TopicLabel key="topic" topic={meta.topic} />]
    : null;
  const metaRows: [string, ReactNode][] = [
    ["Published", formatDate(meta.date)],
    ["Filed", meta.tag],
    ...(topicRow ? [topicRow] : []),
    ["Reading", `${meta.readingTime} min`],
    ["Source", "AI-synthesised"],
  ];

  return (
    <div
      className="hw-page-enter mx-auto max-w-[720px] rail:max-w-[1120px] px-4 pb-20"
      style={{ "--article-accent": accent } as CSSProperties}
    >
      <div className="grid rail:grid-cols-[minmax(0,720px)_320px] gap-12">
        <div className="min-w-0">
          <div className="relative mb-10 overflow-hidden border-t-[3px] border-t-[var(--article-accent)] border-b border-b-border border-double pt-2.5 pb-10">
            <div className="mb-7 flex items-baseline justify-between gap-4">
              <span className={cn(EYEBROW_CLASS, "inline-flex items-center")}>
                Plate II
                {meta.topic && (
                  <>
                    <span aria-hidden="true" className="mx-1.5">
                      ·
                    </span>
                    <TopicLabel topic={meta.topic} />
                  </>
                )}
              </span>
              <span className={EYEBROW_CLASS}>HOWARDISM</span>
            </div>

            <div className="grid grid-cols-[1fr_auto] items-start gap-x-8">
              <div>
                <h1 className="mb-5 font-display font-normal text-[27px] text-foreground leading-[1.25] tracking-[-0.015em]">
                  {meta.title}
                </h1>
                <DataGrid maxWidth={280} rows={metaRows} />
              </div>

              <div
                aria-hidden="true"
                className="relative -mt-2.5 -mr-4 shrink-0"
              >
                <HalfDisc align="right" size={140} />
              </div>
            </div>
          </div>

          <p className="mb-8 border-[var(--article-accent)] border-l-2 pl-4 font-body text-base text-muted-foreground italic leading-[1.65]">
            {meta.description}
          </p>

          {heroImage && (
            <Image
              alt={meta.imageAlt}
              className="mb-10 h-auto w-full rounded-md"
              placeholder="blur"
              sizes="(min-width: 760px) 720px, 100vw"
              src={heroImage}
            />
          )}

          <article>
            <div
              className={cn(
                "prose max-w-none",
                meta.dropCap && "prose-drop-cap"
              )}
            >
              {children}
            </div>

            <div className="my-10 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="font-mono text-[var(--article-accent)] text-xs">
                § end
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Card className="mb-12 px-6 py-5">
              <div className="mb-2 font-medium font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.22em]">
                About this piece
              </div>
              <p className="m-0 font-body text-muted-foreground text-xs">
                Articles in this journal are synthesised by AI agents from a
                curated wiki and are refreshed automatically as new concepts
                arrive. Topics, framing, and editorial direction are curated by
                Howardism.
              </p>
            </Card>

            <div className="rail:hidden">
              <BacklinksDisclosure defaultOpen slug={slug} />
            </div>

            {(previousSlug ?? nextSlug) && (
              <nav
                aria-label="Article navigation"
                className="flex justify-between gap-6"
              >
                <div className="min-w-0">
                  {previousSlug && (
                    <Link
                      className="group inline-flex flex-col gap-1 no-underline"
                      href={`/articles/${previousSlug}`}
                    >
                      <span className={NAV_KICKER_CLASS}>
                        <span aria-hidden="true">← </span>Previous
                      </span>
                      {previousTitle && (
                        <span className={NAV_TITLE_CLASS}>{previousTitle}</span>
                      )}
                    </Link>
                  )}
                </div>
                <div className="min-w-0 text-right">
                  {nextSlug && (
                    <Link
                      className="group inline-flex flex-col items-end gap-1 no-underline"
                      href={`/articles/${nextSlug}`}
                    >
                      <span className={NAV_KICKER_CLASS}>
                        Next<span aria-hidden="true"> →</span>
                      </span>
                      {nextTitle && (
                        <span className={NAV_TITLE_CLASS}>{nextTitle}</span>
                      )}
                    </Link>
                  )}
                </div>
              </nav>
            )}
          </article>
        </div>

        <ArticleRail headings={headings} slug={slug} />
      </div>
    </div>
  );
}
