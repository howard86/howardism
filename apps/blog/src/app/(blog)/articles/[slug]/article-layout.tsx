import { Card } from "@howardism/ui/components/card";
import { cn } from "@howardism/ui/lib/utils";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { DataGrid } from "@/components/howardism/data-grid";
import { HalfDisc } from "@/components/howardism/half-disc";
import { formatDate } from "@/utils/time";

import type { ArticleMeta } from "../service";
import { BacklinksDisclosure } from "./backlinks-disclosure";

interface ArticleLayoutProps {
  children?: ReactNode;
  heroImage?: StaticImageData;
  meta: ArticleMeta;
  nextSlug?: string;
  position?: number;
  previousSlug?: string;
  slug: string;
}

const NAV_LINK_CLASS =
  "inline-flex items-center gap-1.5 font-mono text-brand text-xs no-underline";

export function ArticleLayout({
  children,
  heroImage,
  meta,
  previousSlug,
  nextSlug,
  position = 1,
  slug,
}: ArticleLayoutProps) {
  const plateNumber = String(position).padStart(2, "0");

  return (
    <div className="hw-page-enter mx-auto max-w-[720px] px-4 pb-20">
      <div className="relative mb-10 overflow-hidden border-foreground border-t-2 border-b border-b-border pt-2.5 pb-10">
        <div className="mb-7 flex items-baseline justify-between">
          <span className="font-mono text-[10px] text-foreground-subtle tracking-[0.08em]">
            PLATE II · PIECE № {plateNumber}
          </span>
          <span className="font-mono text-[10px] text-foreground-subtle tracking-[0.08em]">
            HOWARDISM
          </span>
        </div>

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
                ["Source", "AI-synthesised"],
              ]}
            />
          </div>

          <div aria-hidden="true" className="relative -mt-2.5 -mr-4 shrink-0">
            <HalfDisc align="right" size={140} />
          </div>
        </div>
      </div>

      <p className="mb-8 border-brand border-l-2 pl-4 font-body text-base text-muted-foreground italic leading-[1.65]">
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
          className={cn("prose max-w-none", meta.dropCap && "prose-drop-cap")}
        >
          {children}
        </div>

        <div className="my-10 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-foreground-subtle text-xs">
            § end
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Card className="mb-12 px-6 py-5">
          <div className="mb-2 font-medium font-mono text-[0.6875rem] text-foreground-subtle uppercase tracking-[0.16em]">
            About this piece
          </div>
          <p className="m-0 font-body text-muted-foreground text-xs">
            Articles in this journal are synthesised by AI agents from a curated
            wiki and are refreshed automatically as new concepts arrive. Topics,
            framing, and editorial direction are curated by Howardism.
          </p>
        </Card>

        <BacklinksDisclosure slug={slug} />

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
