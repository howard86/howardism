"use client";

import { useEffect, useMemo, useState } from "react";

import { getHistory, type ReadingEntry } from "@/lib/reading-store";
import { useShelfManifest } from "@/lib/shelf-manifest";
import {
  computeShelfStats,
  type ShelfStats as ShelfStatsData,
} from "@/lib/shelf-view";

const NUMERAL_CLASS =
  "font-display font-light text-[clamp(30px,4.4vw,42px)] leading-none tracking-[-0.03em] text-foreground";
const UNIT_CLASS =
  "ml-1 font-normal text-[0.42em] text-foreground-subtle tracking-normal";
const LABEL_CLASS =
  "mt-2 font-mono text-[10px] text-foreground-subtle uppercase leading-normal tracking-[0.16em]";

function StatCell({
  className,
  label,
  unit,
  value,
}: {
  className?: string;
  label: string;
  unit?: string;
  value: string;
}) {
  return (
    <div className={`border-border p-4 sm:px-5 ${className ?? ""}`}>
      <div className={NUMERAL_CLASS}>
        {value}
        {unit && <span className={UNIT_CLASS}>{unit}</span>}
      </div>
      <div className={LABEL_CLASS}>{label}</div>
    </div>
  );
}

/**
 * The masthead's three-cell reading-stats strip, computed from the
 * browser-local history on mount (rendered only on the client, and only once
 * there is something to count). The hours figure is an estimate — history
 * keeps a single latest read per article. The article manifest (for reading
 * times) is fetched only once there's history to resolve against it.
 */
export function ShelfStats() {
  const [history, setHistory] = useState<ReadingEntry[] | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const manifest = useShelfManifest((history?.length ?? 0) > 0);

  const stats = useMemo<ShelfStatsData | null>(() => {
    if (!history || history.length === 0 || !manifest) {
      return null;
    }
    const reads = history.map((entry) => ({
      lastReadAt: entry.lastReadAt,
      pct: entry.pct,
      readingTime: manifest.get(entry.slug)?.readingTime ?? 0,
    }));
    return computeShelfStats(reads, Date.now());
  }, [history, manifest]);

  if (stats === null || stats.notesRead === 0) {
    return null;
  }

  return (
    <div className="mt-7 grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-card">
      <StatCell label="notes read" value={String(stats.notesRead)} />
      <StatCell
        className="border-l"
        label="this week"
        value={String(stats.thisWeek)}
      />
      <StatCell
        className="border-l"
        label="hours read (est.)"
        unit="hrs"
        value={stats.hours.toFixed(1)}
      />
    </div>
  );
}
