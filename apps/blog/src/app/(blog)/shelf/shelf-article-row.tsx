import Link from "next/link";
import type { ReactNode } from "react";

const META_CLASS =
  "font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.16em]";

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

interface ShelfArticleRowProps {
  /** Optional inline tag after the title (e.g. "archived"). */
  badge?: ReactNode;
  /** Trailing control rendered outside the link (remove or save). */
  control: ReactNode;
  href: string;
  /** Meta line: the domain/kind label plus a time phrase. */
  label: string;
  /** When set (0–1), renders the reading-progress bar and percentage. */
  progress?: number;
  /** Compare-selection checkbox; omitted when selection is off. */
  selection?: RowSelection;
  timeText: string;
  title: string;
}

/**
 * The Shelf's compact article row — a single link presentation shared by the
 * History and Saved lists. The trailing `control` sits outside the link so the
 * remove/save button never nests inside the anchor.
 */
export function ShelfArticleRow({
  href,
  title,
  label,
  timeText,
  badge,
  progress,
  control,
  selection,
}: ShelfArticleRowProps) {
  const pct = progress === undefined ? null : Math.round(progress * 100);

  return (
    <li className="flex items-center gap-2 border-border border-b border-dashed py-4 last:border-b-0">
      {selection && (
        <input
          aria-label={selection.label}
          checked={selection.selected}
          className="size-4 shrink-0 accent-brand disabled:opacity-40"
          disabled={selection.disabled}
          onChange={selection.onToggle}
          type="checkbox"
        />
      )}
      <Link
        className="group flex min-w-0 flex-1 items-center gap-4 no-underline"
        href={href}
      >
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-display text-[16px] text-foreground leading-[1.3] transition-colors group-hover:text-brand">
            <span className="truncate">{title}</span>
            {badge}
          </span>
          <span className={`mt-1 block ${META_CLASS}`}>
            {label} · {timeText}
          </span>
        </div>
        {pct !== null && (
          <div className="flex shrink-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="h-1 w-16 overflow-hidden rounded-full bg-border"
            >
              <span
                className="block h-full rounded-full bg-brand/70"
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className={`w-9 text-right ${META_CLASS}`}>{pct}%</span>
          </div>
        )}
      </Link>
      {control}
    </li>
  );
}

/** Shared "archived" tag for rows whose article was archived after reading. */
export function ArchivedBadge() {
  return (
    <span className="shrink-0 rounded-sm border border-border px-1.5 py-0.5 font-mono text-[9px] text-foreground-subtle uppercase tracking-[0.14em]">
      archived
    </span>
  );
}
