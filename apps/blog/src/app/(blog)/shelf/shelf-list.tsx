"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getHistory } from "@/lib/reading-store";
import {
  buildShelfRows,
  type ShelfManifestEntry,
  type ShelfRow,
} from "@/lib/shelf-rows";

dayjs.extend(relativeTime);

const META_CLASS =
  "font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.16em]";

function HistoryRow({ row }: { row: ShelfRow }) {
  const pct = Math.round(row.pct * 100);

  return (
    <li className="border-border border-b border-dashed last:border-b-0">
      <Link
        className="group flex items-center gap-4 py-4 no-underline"
        href={row.href}
      >
        <div className="min-w-0 flex-1">
          <span className="block font-display text-[16px] text-foreground leading-[1.3] transition-colors group-hover:text-brand">
            {row.title}
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
    </li>
  );
}

/**
 * Reads the browser-local reading history on mount and resolves it against the
 * build-time article manifest. Renders nothing until the client read completes
 * (avoids an empty-state flash during hydration), then either the history rows
 * or a friendly empty state.
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

  return (
    <ul className="mt-6 flex list-none flex-col p-0">
      {rows.map((row) => (
        <HistoryRow key={row.slug} row={row} />
      ))}
    </ul>
  );
}
