"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";

import { getHistory } from "@/lib/reading-store";
import {
  buildShelfRows,
  type LinkedShelfRow,
  type ShelfManifestEntry,
} from "@/lib/shelf-rows";
import { isInProgress } from "@/lib/shelf-view";

import { DOMAIN_META } from "../articles/domain-meta";

/** Most in-progress reads worth a card before the rail gets noisy. */
const MAX_CARDS = 5;

function ResumeCard({ row }: { row: LinkedShelfRow }) {
  const accent = row.domain ? DOMAIN_META[row.domain].color : "var(--brand)";
  const pct = Math.round(row.pct * 100);
  const minutesLeft = Math.max(1, Math.round(row.readingTime * (1 - row.pct)));

  return (
    <li className="min-w-0 snap-start">
      <Link
        className="group flex h-full flex-col rounded-[10px] border border-border border-t-2 bg-card p-[18px] pt-4 no-underline transition-colors hover:bg-secondary"
        href={row.href}
        style={{ "--dc": accent, borderTopColor: accent } as CSSProperties}
      >
        <span
          className="font-mono text-[9.5px] uppercase tracking-[0.16em]"
          style={{ color: accent }}
        >
          {row.label}
        </span>
        <span className="mt-2.5 line-clamp-2 font-display font-medium text-[19px] text-foreground leading-[1.22] tracking-[-0.012em] transition-colors group-hover:text-[var(--dc)]">
          {row.title}
        </span>
        <span
          aria-hidden="true"
          className="mt-auto block h-[3px] overflow-hidden rounded-full bg-border pt-0"
        >
          <span
            className="block h-full rounded-full"
            style={{ background: accent, width: `${pct}%` }}
          />
        </span>
        <span className="mt-2 flex justify-between font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.08em]">
          <span>
            resume at{" "}
            <b className="font-semibold" style={{ color: accent }}>
              {pct}%
            </b>
          </span>
          <span>{minutesLeft} min left</span>
        </span>
      </Link>
    </li>
  );
}

/**
 * "Continue reading" — a horizontal snap-scroll rail of the newest in-progress
 * reads, resolved from the browser-local history on mount. Renders nothing
 * server-side, while loading, or when everything on the shelf is finished.
 * Opening a card resumes via the article's own resume chip.
 */
export function ContinueReading({
  manifest,
}: {
  manifest: ShelfManifestEntry[];
}) {
  const [rows, setRows] = useState<LinkedShelfRow[] | null>(null);

  useEffect(() => {
    const inProgress = buildShelfRows(getHistory(), manifest).filter(
      (row): row is LinkedShelfRow =>
        row.kind === "resolved" && isInProgress(row.pct)
    );
    setRows(inProgress.slice(0, MAX_CARDS));
  }, [manifest]);

  if (!rows || rows.length === 0) {
    return null;
  }

  return (
    <section aria-label="Continue reading" className="mt-10">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] text-brand uppercase tracking-[0.22em]">
            Pick up where you left off
          </p>
          <h2 className="mt-1.5 font-display font-normal text-[clamp(22px,3vw,28px)] text-foreground tracking-[-0.02em]">
            Continue <em className="font-light text-brand italic">reading.</em>
          </h2>
        </div>
        <span className="font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.14em]">
          {rows.length} in progress
        </span>
      </div>
      <ul className="m-0 grid snap-x snap-mandatory list-none auto-cols-[minmax(258px,1fr)] grid-flow-col gap-4 overflow-x-auto p-0 pb-2">
        {rows.map((row) => (
          <ResumeCard key={row.slug} row={row} />
        ))}
      </ul>
    </section>
  );
}
