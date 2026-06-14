import { Card } from "@howardism/ui/components/card";
import { cn } from "@howardism/ui/lib/utils";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { PublishArticleNav } from "@/components/article-nav-context";
import { DiscPageHeader } from "@/components/howardism/disc-page-header";
import { DomainLabel } from "@/components/howardism/domain-label";
import { SubjectChipList } from "@/components/howardism/subject-chip-list";
import { SaveButton } from "@/components/save-button";
import { formatDate } from "@/utils/time";
import { PlatePage } from "../../_shell/plate-page";
import { PLATE_META } from "../../plate-meta";
import { DOMAIN_META } from "../domain-meta";
import { kindHasDropCap } from "../kind-meta";
import type {
  ArticleHeading,
  ArticleMeta,
  Locale,
  SiblingNav,
} from "../service";
import { ArticleRail } from "./article-rail";
import { BacklinksDisclosure } from "./backlinks-disclosure";
import { ResumeReading } from "./resume-reading";
import { TapScrollZones } from "./tap-scroll-zones";

interface ArticleLayoutProps {
  children?: ReactNode;
  headings?: ArticleHeading[];
  heroImage?: StaticImageData;
  /** Whether the zh-TW translation is out of date relative to the EN source. */
  isStale?: boolean;
  /** Which language this rendering is; drives the machine-translation badge. */
  locale?: Locale;
  meta: ArticleMeta;
  /** Subject tags with their own page — used to decide which chips link. */
  navigable?: ReadonlySet<string>;
  siblings?: SiblingNav;
  slug: string;
  /** Href of the same article in the other language, when one exists. */
  translationHref?: string;
}

const NO_NAVIGABLE_TAGS: ReadonlySet<string> = new Set();

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
  isStale = false,
  locale = "en",
  meta,
  navigable = NO_NAVIGABLE_TAGS,
  siblings,
  slug,
  translationHref,
}: ArticleLayoutProps) {
  const { previousSlug, previousTitle, nextSlug, nextTitle } = siblings ?? {};
  const accent = meta.domain ? DOMAIN_META[meta.domain].color : "var(--brand)";
  const domainRow: [string, ReactNode] | null = meta.domain
    ? ["Domain", <DomainLabel domain={meta.domain} key="domain" />]
    : null;
  const tagsRow: [string, ReactNode] | null =
    meta.tags && meta.tags.length > 0
      ? [
          "Tags",
          <SubjectChipList key="tags" navigable={navigable} tags={meta.tags} />,
        ]
      : null;
  const metaRows: [string, ReactNode][] = [
    ["Published", formatDate(meta.date)],
    ["Filed", meta.tag],
    ...(domainRow ? [domainRow] : []),
    ...(tagsRow ? [tagsRow] : []),
    ["Reading", `${meta.readingTime} min`],
    ["Source", "AI-synthesised"],
  ];

  return (
    <PlatePage
      header="none"
      plate="domains"
      rail
      style={{ "--article-accent": accent } as CSSProperties}
      width="index"
    >
      <PublishArticleNav headings={headings} slug={slug} />
      <TapScrollZones />
      <ResumeReading headings={headings} slug={slug} />
      <div className="grid rail:grid-cols-[minmax(0,720px)_320px] gap-12">
        <div className="min-w-0">
          <DiscPageHeader
            accent={accent}
            data={metaRows}
            eyebrowEnd={
              <>
                {locale === "zh-TW" && (
                  <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[9.5px] text-foreground-subtle uppercase tracking-[0.18em]">
                    機器翻譯 · machine-translated
                  </span>
                )}
                {locale === "zh-TW" && isStale && (
                  <span className="rounded-sm border border-amber-400/50 px-1.5 py-0.5 font-mono text-[9.5px] text-amber-600 uppercase tracking-[0.18em] dark:text-amber-400">
                    過時翻譯 · stale translation
                  </span>
                )}
                {translationHref && (
                  <Link
                    className={cn(
                      EYEBROW_CLASS,
                      "no-underline transition-colors hover:text-[var(--article-accent)]"
                    )}
                    href={translationHref}
                  >
                    {locale === "zh-TW" ? "EN" : "中文"}
                  </Link>
                )}
                HOWARDISM
              </>
            }
            eyebrowStart={
              <>
                {PLATE_META.domains.label}
                {meta.domain && (
                  <>
                    <span aria-hidden="true" className="mx-1.5">
                      ·
                    </span>
                    <DomainLabel domain={meta.domain} />
                  </>
                )}
              </>
            }
            stackData
            title={meta.title}
            variant="compact"
          >
            <SaveButton showLabel slug={slug} />
          </DiscPageHeader>

          <p className="mt-10 mb-8 border-[var(--article-accent)] border-l-2 pl-4 font-body text-base text-muted-foreground italic leading-[1.65]">
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
                kindHasDropCap(meta.tag) && "prose-drop-cap"
              )}
              data-article-body
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
    </PlatePage>
  );
}
