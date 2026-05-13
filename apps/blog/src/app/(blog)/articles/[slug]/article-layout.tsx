import { Card } from "@howardism/ui/components/card";
import { cn } from "@howardism/ui/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { DataGrid } from "@/components/howardism/data-grid";
import { HalfDisc } from "@/components/howardism/half-disc";
import { formatDate } from "@/utils/time";

import type { ArticleMeta } from "../service";

interface ArticleLayoutProps {
  children?: ReactNode;
  meta: ArticleMeta;
  nextSlug?: string;
  position?: number;
  previousSlug?: string;
}

const NAV_LINK_CLASS =
  "inline-flex items-center gap-1.5 font-mono text-brand text-xs no-underline";

export function ArticleLayout({
  children,
  meta,
  previousSlug,
  nextSlug,
  position = 1,
}: ArticleLayoutProps) {
  const plateNumber = String(position).padStart(2, "0");

  return (
    <div className="hw-page-enter mx-auto max-w-[720px] px-4 pb-20">
      {/* Mini-masthead */}
      <div className="relative mb-10 overflow-hidden border-foreground border-t-2 border-b border-b-border pt-2.5 pb-10">
        {/* Masthead labels */}
        <div className="mb-7 flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-foreground-subtle tracking-[0.08em]">
            PLATE II · PIECE № {plateNumber}
          </span>
          <span className="font-mono text-[10px] text-foreground-subtle tracking-[0.08em]">
            HOWARDISM
          </span>
        </div>

        {/* Title + DataGrid in a 2-col grid; HalfDisc bleeds right */}
        <div className="grid grid-cols-[1fr_auto] items-start gap-x-8">
          <div>
            <h1 className="mb-5 font-display font-normal text-[26px] text-foreground leading-[1.25] tracking-[-0.015em]">
              {meta.title}
            </h1>
            <DataGrid
              maxWidth={280}
              rows={[
                ["Published", formatDate(meta.date)],
                ["Filed", meta.tag],
                ["Reading", `${meta.readingTime} min`],
                ["Author", "Howard Tai"],
              ]}
            />
          </div>

          {/* HalfDisc corner bleed */}
          <div aria-hidden="true" className="relative -mt-2.5 -mr-4 shrink-0">
            <HalfDisc align="right" size={140} />
          </div>
        </div>
      </div>

      {/* Italic description lede */}
      <p className="mb-8 border-brand border-l-2 pl-4 font-body text-base text-muted-foreground italic leading-[1.65]">
        {meta.description}
      </p>

      {/* Article prose */}
      <article>
        <div
          className={cn("prose max-w-none", meta.dropCap && "prose-drop-cap")}
        >
          {children}
        </div>

        {/* § end rule */}
        <div className="my-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-foreground-subtle text-xs">
            § end
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Author card */}
        <Card className="mb-12 px-6 py-5">
          <div className="mb-2 font-medium font-mono text-[0.6875rem] text-foreground-subtle uppercase tracking-[0.16em]">
            About the author
          </div>
          <p className="m-0 font-body text-muted-foreground text-xs">
            Howard Tai is a software engineer and amateur diver based in
            Singapore. He writes about engineering, mathematics, and the
            occasional ocean adventure.
          </p>
        </Card>

        {/* Bracketed prev/next nav */}
        {(previousSlug ?? nextSlug) && (
          <nav
            aria-label="Article navigation"
            className="flex justify-between gap-4"
          >
            <div>
              {previousSlug && (
                <Link
                  className={NAV_LINK_CLASS}
                  href={`/articles/${previousSlug}`}
                >
                  <span aria-hidden="true">[←]</span>
                  <span>Previous</span>
                </Link>
              )}
            </div>
            <div>
              {nextSlug && (
                <Link className={NAV_LINK_CLASS} href={`/articles/${nextSlug}`}>
                  <span>Next</span>
                  <span aria-hidden="true">[→]</span>
                </Link>
              )}
            </div>
          </nav>
        )}
      </article>
    </div>
  );
}
