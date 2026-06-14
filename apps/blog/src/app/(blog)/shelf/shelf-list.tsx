"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getHistory, removeFromHistory } from "@/lib/reading-store";
import {
  buildShelfRows,
  type LinkedShelfRow,
  type ShelfManifestEntry,
  type ShelfRow,
} from "@/lib/shelf-rows";

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

function LinkedRow({
  row,
  onRemove,
}: {
  row: LinkedShelfRow;
  onRemove: () => void;
}) {
  const pct = Math.round(row.pct * 100);

  return (
    <>
      <Link
        className="group flex min-w-0 flex-1 items-center gap-4 no-underline"
        href={row.href}
      >
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-display text-[16px] text-foreground leading-[1.3] transition-colors group-hover:text-brand">
            <span className="truncate">{row.title}</span>
            {row.kind === "archived" && (
              <span className="shrink-0 rounded-sm border border-border px-1.5 py-0.5 font-mono text-[9px] text-foreground-subtle uppercase tracking-[0.14em]">
                archived
              </span>
            )}
          </span>
          <span className={`mt-1 block ${META_CLASS}`}>
            {row.label} · {dayjs(row.lastReadAt).fromNow()}
          </span>
        </div>
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
      </Link>
      <RemoveButton
        label={`Remove ${row.title} from shelf`}
        onClick={onRemove}
      />
    </>
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
    <>
      <div className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-display text-[16px] text-foreground-subtle italic leading-[1.3]">
          <span className="truncate">{slug}</span>
        </span>
        <span className={`mt-1 block ${META_CLASS}`}>no longer available</span>
      </div>
      <RemoveButton label={`Dismiss ${slug}`} onClick={onDismiss} />
    </>
  );
}

function HistoryRow({
  row,
  onRemove,
}: {
  row: ShelfRow;
  onRemove: (slug: string) => void;
}) {
  return (
    <li className="flex items-center gap-2 border-border border-b border-dashed py-4 last:border-b-0">
      {row.kind === "deleted" ? (
        <TombstoneRow onDismiss={() => onRemove(row.slug)} slug={row.slug} />
      ) : (
        <LinkedRow onRemove={() => onRemove(row.slug)} row={row} />
      )}
    </li>
  );
}

/**
 * Reads the browser-local reading history on mount and resolves it against the
 * build-time article manifest. Renders nothing until the client read completes
 * (avoids an empty-state flash during hydration), then either the history rows
 * — each removable, archived reads tagged, deleted reads shown as dismissible
 * tombstones — or a friendly empty state.
 */
export function ShelfList({ manifest }: { manifest: ShelfManifestEntry[] }) {
  const [rows, setRows] = useState<ShelfRow[] | null>(null);

  useEffect(() => {
    setRows(buildShelfRows(getHistory(), manifest));
  }, [manifest]);

  if (rows === null) {
    return null;
  }

  if (rows.length === 0) {
    return (
      <p className="mt-8 font-body text-[15px] text-muted-foreground leading-[1.6]">
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
    <ul className="mt-6 flex list-none flex-col p-0">
      {rows.map((row) => (
        <HistoryRow key={row.slug} onRemove={handleRemove} row={row} />
      ))}
    </ul>
  );
}
