"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";

import { getHistory, removeFromHistory } from "@/lib/reading-store";
import {
  buildShelfRows,
  type ShelfManifestEntry,
  type ShelfRow,
} from "@/lib/shelf-rows";

import { DOMAIN_META } from "../articles/domain-meta";
import {
  ArchivedBadge,
  type ListSelection,
  ShelfArticleRow,
  toRowSelection,
} from "./shelf-article-row";

dayjs.extend(relativeTime);

const META_CLASS =
  "font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.16em]";
const REMOVE_CLASS =
  "flex size-7 shrink-0 items-center justify-center rounded-full text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground";

function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={REMOVE_CLASS}
      onClick={onClick}
      type="button"
    >
      <span aria-hidden="true">×</span>
    </button>
  );
}

function TombstoneRow({
  slug,
  onDismiss,
}: {
  slug: string;
  onDismiss: () => void;
}) {
  return (
    <li className="flex items-center gap-2 border-border border-t border-dashed py-4">
      <div className="min-w-0 flex-1">
        <span className="block truncate font-display text-[16px] text-foreground-subtle italic leading-[1.3]">
          {slug}
        </span>
        <span className={`mt-1 block ${META_CLASS}`}>no longer available</span>
      </div>
      <RemoveButton label={`Dismiss ${slug}`} onClick={onDismiss} />
    </li>
  );
}

function HistoryRow({
  row,
  ordinal,
  onRemove,
  selection,
}: {
  row: ShelfRow;
  ordinal: number;
  onRemove: (slug: string) => void;
  selection?: ListSelection;
}) {
  if (row.kind === "deleted") {
    return (
      <TombstoneRow onDismiss={() => onRemove(row.slug)} slug={row.slug} />
    );
  }
  return (
    <ShelfArticleRow
      accent={row.domain ? DOMAIN_META[row.domain].color : "var(--brand)"}
      badge={row.kind === "archived" ? <ArchivedBadge /> : undefined}
      control={
        <RemoveButton
          label={`Remove ${row.title} from shelf`}
          onClick={() => onRemove(row.slug)}
        />
      }
      href={row.href}
      label={row.label}
      marker={row.kindPrefix + String(ordinal).padStart(2, "0")}
      progress={row.pct}
      readingTime={row.readingTime}
      selection={toRowSelection(selection, row.slug, row.title)}
      tags={row.tags}
      timeText={dayjs(row.lastReadAt).fromNow()}
      title={row.title}
    />
  );
}

/**
 * History tab: reads the browser-local reading history on mount and resolves
 * it against the build-time article manifest. Renders nothing until the client
 * read completes (avoids an empty-state flash), then the rows — each removable,
 * archived reads tagged, deleted reads shown as dismissible tombstones — or a
 * friendly empty state.
 */
export function ShelfList({
  manifest,
  selection,
}: {
  manifest: ShelfManifestEntry[];
  selection?: ListSelection;
}) {
  const [rows, setRows] = useState<ShelfRow[] | null>(null);

  useEffect(() => {
    setRows(buildShelfRows(getHistory(), manifest));
  }, [manifest]);

  if (rows === null) {
    return null;
  }

  if (rows.length === 0) {
    return (
      <p className="mt-6 font-body text-[15px] text-muted-foreground leading-[1.6]">
        Nothing on your shelf yet. Read past the opening of any article and it
        lands here automatically — saved only in this browser.
      </p>
    );
  }

  const handleRemove = (slug: string) => {
    removeFromHistory(slug);
    setRows((current) =>
      current ? current.filter((row) => row.slug !== slug) : current
    );
  };

  return (
    <ul className="mt-2 flex list-none flex-col p-0">
      {rows.map((row, index) => (
        <HistoryRow
          key={row.slug}
          onRemove={handleRemove}
          ordinal={index + 1}
          row={row}
          selection={selection}
        />
      ))}
    </ul>
  );
}
