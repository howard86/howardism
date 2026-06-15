import { cn } from "@howardism/ui/lib/utils";

import { DomainLabel } from "@/components/howardism/domain-label";
import { SubjectChipList } from "@/components/howardism/subject-chip-list";
import { InternalLink } from "@/components/internal-link";
import { SaveButton } from "@/components/save-button";
import { formatDateShort } from "@/utils/time";

import type { ArticleEntity } from "./service";

const NO_NAVIGABLE: ReadonlySet<string> = new Set();

interface IndexRowProps {
  /** Numeral tint (domain or kind color). */
  accent: string;
  article: ArticleEntity;
  density?: "comfortable" | "compact";
  /** First row in its list — gets the accent top rule instead of a hairline. */
  first?: boolean;
  /** Subject tags with their own page — decides which chips link. */
  navigable?: ReadonlySet<string>;
  /** 1-based position within its list — rendered as the numeral marker. */
  ordinal: number;
  /** Kind letter before the ordinal (C / E / S / I); omit for a bare numeral. */
  prefix?: string;
  /** Show subject chips under the title. */
  showChips?: boolean;
  /** Show the domain label column (hide on single-domain pages). */
  showDomain?: boolean;
  /** Show the trailing save button. */
  showSave?: boolean;
}

const META_CLASS =
  "whitespace-nowrap font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.12em]";

/**
 * The single article-list row, used by every index on the blog. Five facts,
 * left to right: numeral marker · title (+ subject chips) · domain · date ·
 * reading · save. Columns toggle by prop so one component renders the home
 * plates, the kind plates, and the domain/tag listings.
 */
export function IndexRow({
  article,
  ordinal,
  accent,
  prefix,
  navigable = NO_NAVIGABLE,
  showDomain = true,
  showChips = true,
  showSave = true,
  density = "comfortable",
  first = false,
}: IndexRowProps) {
  const { meta, slug } = article;
  const compact = density === "compact";
  const tags = meta.tags ?? [];

  return (
    <li
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4",
        compact ? "py-2.5" : "py-3.5"
      )}
      style={{
        borderTop: first ? `2px solid ${accent}` : "1px solid var(--border)",
      }}
    >
      <span
        className={cn(
          "font-display font-light leading-[0.9] tracking-[-0.03em]",
          compact ? "text-[22px]" : "text-[28px]"
        )}
        style={{ color: accent }}
      >
        {prefix}
        {String(ordinal).padStart(2, "0")}
      </span>

      <div className="min-w-0">
        <InternalLink
          className={cn(
            "font-display font-medium text-foreground tracking-[-0.012em] no-underline transition-colors hover:text-brand",
            compact ? "text-[16px] leading-[1.25]" : "text-[19px] leading-[1.2]"
          )}
          href={`/articles/${slug}`}
          previewMeta={meta}
        >
          {meta.title}
        </InternalLink>
        {showChips && tags.length > 0 && (
          <div className="mt-1.5">
            <SubjectChipList limit={3} navigable={navigable} tags={tags} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-x-4">
        {showDomain && meta.domain && (
          <span className={cn(META_CLASS, "hidden sm:inline")}>
            <DomainLabel domain={meta.domain} />
          </span>
        )}
        <span className={cn(META_CLASS, "text-right tabular-nums")}>
          <time dateTime={meta.date}>{formatDateShort(meta.date)}</time> ·{" "}
          {meta.readingTime}′
        </span>
        {showSave && (
          <span className="-translate-y-0.5">
            <SaveButton slug={slug} />
          </span>
        )}
      </div>
    </li>
  );
}
