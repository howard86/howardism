import { cn } from "@howardism/ui/lib/utils";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { DONE_PCT } from "@/lib/shelf-view";

const META_CLASS =
  "font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.12em]";
/** Micro type stop for the mobile meta line, tag chips, and badges. */
const MICRO_CLASS =
  "font-mono text-[9.5px] text-foreground-subtle uppercase tracking-[0.08em]";

/** Most subject chips a row shows before they crowd the title. */
const MAX_CHIPS = 3;

/** Compare-selection state for a single row; omit to hide the checkbox. */
export interface RowSelection {
  /** True when the selection cap is reached and this row isn't selected. */
  disabled: boolean;
  /** Accessible label for the checkbox. */
  label: string;
  onToggle: () => void;
  selected: boolean;
}

/** List-level compare selection shared by both Shelf tabs; omit to disable it. */
export interface ListSelection {
  /** True once the selection cap (3) is reached. */
  atLimit: boolean;
  onToggleSelect: (slug: string) => void;
  selectedSlugs: ReadonlySet<string>;
}

/** Build a row's checkbox state from the shared list selection. */
export function toRowSelection(
  selection: ListSelection | undefined,
  slug: string,
  title: string
): RowSelection | undefined {
  if (!selection) {
    return;
  }
  const selected = selection.selectedSlugs.has(slug);
  return {
    selected,
    disabled: selection.atLimit && !selected,
    onToggle: () => selection.onToggleSelect(slug),
    label: `Select ${title} to compare`,
  };
}

/** Grid templates; the compare checkbox prepends a column when selection is on. */
const GRID_PLAIN =
  "grid-cols-[40px_1fr_28px] md:grid-cols-[52px_1fr_150px_112px_116px_28px]";
const GRID_SELECT =
  "grid-cols-[18px_40px_1fr_28px] md:grid-cols-[18px_52px_1fr_150px_112px_116px_28px]";

function ProgressFacts({ pct }: { pct: number }) {
  if (pct >= DONE_PCT * 100) {
    return (
      <span
        className={cn(
          META_CLASS,
          "flex items-center justify-end gap-1.5 text-foreground"
        )}
      >
        <span aria-hidden="true">✓</span> read
      </span>
    );
  }
  return (
    <span className="flex items-center justify-end gap-2">
      <span
        aria-hidden="true"
        className="h-[3px] w-[52px] overflow-hidden rounded-full bg-border"
      >
        <span
          className="block h-full rounded-full bg-[var(--dc)]"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span
        className={cn(
          META_CLASS,
          "w-9 text-right text-muted-foreground tabular-nums"
        )}
      >
        {pct}%
      </span>
    </span>
  );
}

interface ShelfArticleRowProps {
  /** Domain (or kind) color token tinting the marker, dots, and bar. */
  accent: string;
  /** Optional inline tag after the title (e.g. "archived"). */
  badge?: ReactNode;
  /** Trailing control rendered outside the link (remove or save). */
  control: ReactNode;
  href: string;
  /** Domain display name, or the article kind when it has no domain. */
  label: string;
  /** Marker text: kind prefix + 2-digit position, e.g. "C04". */
  marker: string;
  /** When set (0–1), renders the reading-progress facts. */
  progress?: number;
  /** Estimated reading time in minutes. */
  readingTime: number;
  /** Compare-selection checkbox; omitted when selection is off. */
  selection?: RowSelection;
  /** Subject tags, capped to the first few. */
  tags: string[];
  timeText: string;
  title: string;
}

/**
 * The Shelf's article row — one grid shared by the History and Saved lists:
 * marker · title (+ chips) · domain · progress · time · control. The domain,
 * progress, and time columns collapse into a meta line under the title on
 * small screens. The trailing `control` sits outside the link so the
 * remove/save button never nests inside the anchor.
 */
export function ShelfArticleRow({
  accent,
  href,
  title,
  label,
  marker,
  timeText,
  badge,
  progress,
  readingTime,
  tags,
  control,
  selection,
}: ShelfArticleRowProps) {
  const pct = progress === undefined ? null : Math.round(progress * 100);
  const chips = tags.slice(0, MAX_CHIPS);

  return (
    <li
      className={cn(
        "group -mx-3 grid items-start gap-x-3 rounded-md border-border border-t px-3 py-4 transition-colors md:items-center md:gap-x-4",
        selection ? GRID_SELECT : GRID_PLAIN,
        selection?.selected
          ? "bg-brand/5 hover:bg-brand/10"
          : "hover:bg-secondary"
      )}
      style={{ "--dc": accent } as CSSProperties}
    >
      {selection && (
        <input
          aria-label={selection.label}
          checked={selection.selected}
          className="mt-2 size-[18px] shrink-0 accent-brand disabled:opacity-40 md:mt-0"
          disabled={selection.disabled}
          onChange={selection.onToggle}
          type="checkbox"
        />
      )}
      <span className="whitespace-nowrap font-display font-light text-[22px] text-foreground-subtle leading-[0.9] tracking-[-0.03em] md:text-[28px]">
        {marker}
      </span>
      <div className="min-w-0">
        <span className="flex flex-wrap items-baseline gap-2">
          <Link
            className="font-display font-medium text-[17px] text-foreground leading-[1.25] tracking-[-0.012em] no-underline transition-colors group-hover:text-[var(--dc)] md:text-[19px]"
            href={href}
          >
            {title}
          </Link>
          {badge}
        </span>
        {chips.length > 0 && (
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {chips.map((tag) => (
              <span
                className={cn(
                  MICRO_CLASS,
                  "rounded-sm border border-border px-1.5 py-0.5"
                )}
                key={tag}
              >
                {tag}
              </span>
            ))}
          </span>
        )}
        <span
          className={cn(
            MICRO_CLASS,
            "mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 md:hidden"
          )}
        >
          <span
            aria-hidden="true"
            className="size-[7px] rounded-full bg-[var(--dc)]"
          />
          {label}
          {pct !== null && (
            <>
              <span aria-hidden="true">·</span>
              {pct >= DONE_PCT * 100 ? "✓ read" : `${pct}%`}
            </>
          )}
          <span aria-hidden="true">·</span>
          {timeText}
          <span aria-hidden="true">·</span>
          {readingTime}′
        </span>
      </div>
      <span
        className={`hidden items-center gap-2 whitespace-nowrap md:flex ${META_CLASS}`}
      >
        <span
          aria-hidden="true"
          className="size-[7px] shrink-0 rounded-full bg-[var(--dc)]"
        />
        <span className="truncate">{label}</span>
      </span>
      <span className="hidden md:block">
        {pct !== null && <ProgressFacts pct={pct} />}
      </span>
      <span
        className={`hidden text-right md:block ${META_CLASS} whitespace-nowrap`}
      >
        {timeText} · {readingTime}′
      </span>
      {control}
    </li>
  );
}

/** Shared "archived" tag for rows whose article was archived after reading. */
export function ArchivedBadge() {
  return (
    <span
      className={cn(
        MICRO_CLASS,
        "shrink-0 rounded-sm border border-border px-1.5 py-0.5"
      )}
    >
      archived
    </span>
  );
}
