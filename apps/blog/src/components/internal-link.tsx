"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@howardism/ui/components/hover-card";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import type { ArticleMeta } from "@/app/(blog)/articles/service";
import { TagChip } from "@/components/tag-chip";
import { truncate } from "@/utils/text";

export const ARTICLES_PREFIX = "/articles/";
const PREVIEW_DESCRIPTION_MAX = 140;
const HOVER_OPEN_DELAY_MS = 200;
const HOVER_CLOSE_DELAY_MS = 100;
const SLUG_TERMINATOR_RE = /[?#/]/;

type LinkProps = ComponentProps<typeof Link>;

export interface InternalLinkProps extends Omit<LinkProps, "href"> {
  href: string;
  /**
   * Pre-resolved frontmatter for the destination. When provided, the
   * hover-card renders without an extra client-side fetch.
   */
  previewMeta?: ArticleMeta;
}

export function InternalLink({
  href,
  previewMeta,
  className,
  children,
  ...linkProps
}: InternalLinkProps) {
  const pathname = usePathname();
  const slug = extractArticleSlug(href);
  const isCurrentArticle =
    slug !== null && pathname === `${ARTICLES_PREFIX}${slug}`;
  const shouldShowPreview =
    slug !== null && !isCurrentArticle && previewMeta !== undefined;

  if (!shouldShowPreview) {
    return (
      <Link className={className} href={href} {...linkProps}>
        {children}
      </Link>
    );
  }

  const describedById = `internal-link-preview-${slug}`;

  return (
    <HoverCard
      closeDelay={HOVER_CLOSE_DELAY_MS}
      openDelay={HOVER_OPEN_DELAY_MS}
    >
      <HoverCardTrigger asChild>
        <Link
          aria-describedby={describedById}
          className={className}
          href={href}
          {...linkProps}
        >
          {children}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="max-w-[320px] bg-background/90 p-3.5"
        id={describedById}
        role="dialog"
        side="top"
        sideOffset={8}
      >
        <InternalLinkPreviewBody meta={previewMeta} />
      </HoverCardContent>
    </HoverCard>
  );
}

interface InternalLinkPreviewBodyProps {
  meta: ArticleMeta;
}

/**
 * Separate export so tests can render the body in isolation — Radix's portal
 * + open-state behaviour doesn't unwrap cleanly under happy-dom.
 */
export function InternalLinkPreviewBody({
  meta,
}: InternalLinkPreviewBodyProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <TagChip tag={meta.tag} />
      <span className="font-display font-semibold text-[0.95rem] text-foreground leading-snug">
        {meta.title}
      </span>
      <p className="m-0 font-body text-muted-foreground text-xs leading-normal">
        {truncate(meta.description, PREVIEW_DESCRIPTION_MAX)}
      </p>
      <span className="mt-0.5 font-medium font-mono text-[0.625rem] text-brand uppercase tracking-[0.14em]">
        Read →
      </span>
    </div>
  );
}

export function extractArticleSlug(href: string): string | null {
  if (!href.startsWith(ARTICLES_PREFIX)) {
    return null;
  }
  const remainder = href.slice(ARTICLES_PREFIX.length);
  const slug = remainder.split(SLUG_TERMINATOR_RE)[0];
  return slug.length > 0 ? slug : null;
}
