"use client";

import type { WikiDomain } from "@howardism/article-contract";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@howardism/ui/components/tabs";
import { cn } from "@howardism/ui/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import { SaveButton } from "@/components/save-button";
import { buildCompareHref, MAX_COMPARE } from "@/lib/compare-ids";
import { getHistory, getSaved, removeFromHistory } from "@/lib/reading-store";
import {
  buildShelfRows,
  type ShelfManifestEntry,
  type ShelfRow,
} from "@/lib/shelf-rows";
import {
  BUCKET_LABELS,
  bucketOf,
  SHELF_SORT_COMPARATORS,
  type ShelfRead,
  type ShelfSort,
} from "@/lib/shelf-view";

import { DOMAIN_META } from "../articles/domain-meta";
import {
  ArchivedBadge,
  type ListSelection,
  ShelfArticleRow,
  toRowSelection,
} from "./shelf-article-row";

dayjs.extend(relativeTime);

/** Minimum selection that makes a comparison meaningful. */
const MIN_COMPARE = 2;

const META_CLASS =
  "font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.16em]";
const SEG_BUTTON_CLASS =
  "border-border border-r px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors last:border-r-0";
const CHIP_CLASS =
  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors";
const INVITE_LINK_CLASS =
  "mt-5 inline-block font-mono text-[11px] text-brand uppercase tracking-[0.16em] no-underline transition-colors hover:text-foreground";

type ShelfTab = "history" | "saved";

/** A saved article resolved against the manifest, plus any read progress. */
interface SavedRow {
  /**
   * 1-based accession number, ranked by save time, so the row marker stays put
   * under any sort or filter.
   */
  accession: number;
  meta: ShelfManifestEntry;
  /** Reading progress when the article also appears in the history. */
  pct?: number;
  savedAt: number;
}

interface ShelfData {
  history: ShelfRow[];
  saved: SavedRow[];
}

/** Sort facts for a history row; a tombstone sorts as a zero-length read. */
const readOf = (row: ShelfRow): ShelfRead => ({
  lastReadAt: row.lastReadAt,
  pct: row.pct,
  readingTime: row.kind === "deleted" ? 0 : row.readingTime,
});

/** Sort facts for a saved row; recency is the save time, not the read time. */
const savedReadOf = (row: SavedRow): ShelfRead => ({
  lastReadAt: row.savedAt,
  pct: row.pct ?? 0,
  readingTime: row.meta.readingTime,
});

const domainOf = (row: ShelfRow): WikiDomain | undefined =>
  row.kind === "deleted" ? undefined : row.domain;

const accentOf = (domain: WikiDomain | undefined): string =>
  domain ? DOMAIN_META[domain].color : "var(--brand)";

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
      className="flex size-7 shrink-0 items-center justify-center rounded-full text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
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

function GroupHeader({ count, label }: { count: number; label: string }) {
  return (
    <li className="flex items-baseline gap-3.5 pt-6 pb-2 first:pt-1">
      <span className="font-mono text-[11px] text-foreground uppercase tracking-[0.2em]">
        {label}
      </span>
      <span className="font-mono text-[10.5px] text-foreground-subtle">
        {count}
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </li>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 max-w-[56ch] font-body text-[15px] text-muted-foreground leading-[1.6]">
      {children}
    </p>
  );
}

function CompareBar({
  count,
  onCompare,
  onClear,
}: {
  count: number;
  onCompare: () => void;
  onClear: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-border border-t bg-card/95 px-gutter py-3 shadow-paper-lg backdrop-blur-sm">
      <div className="mx-auto flex max-w-wide items-center justify-between gap-4">
        <span className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.16em]">
          {count} selected
          {count < MIN_COMPARE && (
            <span className="ml-2 opacity-70">
              · pick {MIN_COMPARE - count} more
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full px-3 py-1.5 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.16em] transition-colors hover:text-foreground"
            onClick={onClear}
            type="button"
          >
            Clear
          </button>
          <button
            className="rounded-full bg-brand px-4 py-1.5 font-mono text-[11px] text-white uppercase tracking-[0.16em] transition-opacity hover:opacity-90 disabled:opacity-40"
            disabled={count < MIN_COMPARE}
            onClick={onCompare}
            type="button"
          >
            Compare ({count}) →
          </button>
        </div>
      </div>
    </div>
  );
}

const SORTS: [ShelfSort, string][] = [
  ["recent", "Recent"],
  ["progress", "Progress"],
  ["longest", "Longest"],
];

/**
 * Interleave the history rows with recency group headers (when grouped) and
 * render tombstones for reads whose article no longer exists. The marker
 * ordinal is the row's accession number, so it survives re-sorting.
 */
function buildHistoryItems({
  rows,
  grouped,
  now,
  selection,
  onRemove,
}: {
  rows: ShelfRow[];
  grouped: boolean;
  now: number;
  selection?: ListSelection;
  onRemove: (slug: string) => void;
}): ReactNode[] {
  const items: ReactNode[] = [];
  let lastBucket = -1;
  for (const row of rows) {
    if (grouped) {
      const bucket = bucketOf(row.lastReadAt, now);
      if (bucket !== lastBucket) {
        const count = rows.filter(
          (entry) => bucketOf(entry.lastReadAt, now) === bucket
        ).length;
        items.push(
          <GroupHeader
            count={count}
            key={`bucket-${bucket}`}
            label={BUCKET_LABELS[bucket]}
          />
        );
        lastBucket = bucket;
      }
    }
    if (row.kind === "deleted") {
      items.push(
        <TombstoneRow
          key={row.slug}
          onDismiss={() => onRemove(row.slug)}
          slug={row.slug}
        />
      );
    } else {
      items.push(
        <ShelfArticleRow
          accent={accentOf(row.domain)}
          badge={row.kind === "archived" ? <ArchivedBadge /> : undefined}
          control={
            <RemoveButton
              label={`Remove ${row.title} from shelf`}
              onClick={() => onRemove(row.slug)}
            />
          }
          href={row.href}
          key={row.slug}
          label={row.label}
          marker={row.kindPrefix + String(row.accession).padStart(2, "0")}
          progress={row.pct}
          readingTime={row.readingTime}
          selection={toRowSelection(selection, row.slug, row.title)}
          tags={row.tags}
          timeText={dayjs(row.lastReadAt).fromNow()}
          title={row.title}
        />
      );
    }
  }
  return items;
}

const TAB_TRIGGER_CLASS =
  "rounded-full px-3.5 font-mono text-[11px] uppercase tracking-[0.16em]";

/**
 * The Shelf's tabbed shell: automatic reading History and deliberate Saved
 * lists, both read from browser storage on mount and resolved against the same
 * build-time article manifest. Owns every view control — tab, sort order,
 * domain filter, and the compare mode whose cross-tab selection (a History
 * pick and a Saved pick combine, capped at three) launches the comparison.
 * With nothing read and nothing saved there is nothing to control, so the
 * whole shell collapses to an invitation into the article index.
 */
export function ShelfTabs({ manifest }: { manifest: ShelfManifestEntry[] }) {
  const router = useRouter();
  const [data, setData] = useState<ShelfData | null>(null);
  const [tab, setTab] = useState<ShelfTab>("history");
  const [sort, setSort] = useState<ShelfSort>("recent");
  const [domain, setDomain] = useState<WikiDomain | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const history = buildShelfRows(getHistory(), manifest);
    const pctBySlug = new Map(
      history.map((row) => [row.slug, row.pct] as const)
    );
    const bySlug = new Map(manifest.map((entry) => [entry.slug, entry]));
    const savedEntries = getSaved();
    const savedAccessions = new Map(
      [...savedEntries]
        .sort((a, b) => a.savedAt - b.savedAt)
        .map((entry, index) => [entry.slug, index + 1] as const)
    );
    const saved: SavedRow[] = [];
    for (const entry of savedEntries) {
      const meta = bySlug.get(entry.slug);
      if (meta) {
        saved.push({
          meta,
          savedAt: entry.savedAt,
          pct: pctBySlug.get(entry.slug),
          accession: savedAccessions.get(entry.slug) ?? 0,
        });
      }
    }
    setData({ history, saved });
  }, [manifest]);

  const selection: ListSelection = useMemo(
    () => ({
      selectedSlugs: new Set(selected),
      atLimit: selected.length >= MAX_COMPARE,
      onToggleSelect: (slug: string) =>
        setSelected((current) => {
          if (current.includes(slug)) {
            return current.filter((entry) => entry !== slug);
          }
          if (current.length >= MAX_COMPARE) {
            return current;
          }
          return [...current, slug];
        }),
    }),
    [selected]
  );
  const rowSelection = compareMode ? selection : undefined;

  if (data === null) {
    return null;
  }

  // Nothing read and nothing saved: no view controls to offer, so the whole
  // shell collapses to an invitation.
  if (data.history.length === 0 && data.saved.length === 0) {
    return (
      <div className="mt-9 border-border border-t">
        <EmptyState>
          Your shelf fills itself as you read — get past the opening of any
          article and it lands here. Start anywhere in the index, and come back
          when you want to pick something up again.
        </EmptyState>
        <Link className={INVITE_LINK_CLASS} href="/articles">
          Browse all articles →
        </Link>
      </div>
    );
  }

  const activeDomains =
    tab === "history"
      ? data.history.map(domainOf)
      : data.saved.map((row) => row.meta.domain);
  const domainCounts = new Map<WikiDomain, number>();
  for (const key of activeDomains) {
    if (key) {
      domainCounts.set(key, (domainCounts.get(key) ?? 0) + 1);
    }
  }

  const handleRemove = (slug: string) => {
    removeFromHistory(slug);
    setData((current) =>
      current
        ? {
            ...current,
            history: current.history.filter((row) => row.slug !== slug),
          }
        : current
    );
    setSelected((current) => current.filter((entry) => entry !== slug));
  };

  const handleUnsave = (slug: string, nowSaved: boolean) => {
    if (!nowSaved) {
      setData((current) =>
        current
          ? {
              ...current,
              saved: current.saved.filter((row) => row.meta.slug !== slug),
            }
          : current
      );
    }
  };

  const startCompare = () => {
    if (selected.length >= MIN_COMPARE) {
      router.push(buildCompareHref(selected));
    }
  };

  const toggleCompare = () => {
    setCompareMode((current) => !current);
    setSelected([]);
  };

  const filteredEmpty = domain ? (
    <EmptyState>
      Nothing on your shelf under{" "}
      <b className="font-medium text-foreground">{DOMAIN_META[domain].label}</b>{" "}
      yet. Clear the filter, or read an article in that domain.
    </EmptyState>
  ) : null;

  const historyRows = data.history
    .filter((row) => domain === null || domainOf(row) === domain)
    .sort((a, b) => SHELF_SORT_COMPARATORS[sort](readOf(a), readOf(b)));
  const savedRows = data.saved
    .filter((row) => domain === null || row.meta.domain === domain)
    .sort((a, b) =>
      SHELF_SORT_COMPARATORS[sort](savedReadOf(a), savedReadOf(b))
    );
  const grouped = tab === "history" && sort === "recent";
  const historyItems = buildHistoryItems({
    rows: historyRows,
    grouped,
    now: Date.now(),
    selection: rowSelection,
    onRemove: handleRemove,
  });

  return (
    <>
      <Tabs onValueChange={(value) => setTab(value as ShelfTab)} value={tab}>
        <div className="sticky top-20 z-30 -mx-3 mt-9 border-border border-b bg-background/85 px-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-3 pt-3 pb-2 md:gap-4">
            <TabsList variant="line">
              <TabsTrigger className={TAB_TRIGGER_CLASS} value="history">
                History
                <span className="text-foreground-subtle">
                  {data.history.length}
                </span>
              </TabsTrigger>
              <TabsTrigger className={TAB_TRIGGER_CLASS} value="saved">
                Saved
                <span className="text-foreground-subtle">
                  {data.saved.length}
                </span>
              </TabsTrigger>
            </TabsList>
            <span className="flex-1" />
            <button
              className={cn(
                "rounded-lg border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors",
                compareMode
                  ? "border-brand bg-brand text-white"
                  : "border-border text-muted-foreground hover:border-brand hover:text-brand"
              )}
              onClick={toggleCompare}
              type="button"
            >
              {compareMode ? "Cancel" : "Select"}
            </button>
            <fieldset
              aria-label="Sort"
              className="flex overflow-hidden rounded-lg border border-border bg-card"
            >
              {SORTS.map(([key, label]) => (
                <button
                  aria-pressed={sort === key}
                  className={cn(
                    SEG_BUTTON_CLASS,
                    sort === key
                      ? "bg-accent text-foreground"
                      : "text-foreground-subtle hover:bg-secondary hover:text-foreground"
                  )}
                  key={key}
                  onClick={() => setSort(key)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </fieldset>
          </div>
          <fieldset
            aria-label="Filter by domain"
            className="flex gap-2 overflow-x-auto pb-3"
          >
            <button
              aria-pressed={domain === null}
              className={cn(
                CHIP_CLASS,
                domain === null
                  ? "border-foreground-subtle text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setDomain(null)}
              type="button"
            >
              All
              <span className="text-foreground-subtle">
                {activeDomains.length}
              </span>
            </button>
            {(Object.keys(DOMAIN_META) as WikiDomain[])
              .filter((key) => (domainCounts.get(key) ?? 0) > 0)
              .map((key) => (
                <button
                  aria-pressed={domain === key}
                  className={cn(
                    CHIP_CLASS,
                    domain === key
                      ? "border-[var(--dc)] bg-card text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                  key={key}
                  onClick={() =>
                    setDomain((current) => (current === key ? null : key))
                  }
                  style={{ "--dc": DOMAIN_META[key].color } as CSSProperties}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full bg-[var(--dc)]"
                  />
                  {DOMAIN_META[key].label}
                  <span className="text-foreground-subtle">
                    {domainCounts.get(key)}
                  </span>
                </button>
              ))}
          </fieldset>
        </div>

        <TabsContent value="history">
          {historyItems.length > 0 ? (
            <ul className="mt-3 flex list-none flex-col p-0">{historyItems}</ul>
          ) : (
            (filteredEmpty ?? (
              <EmptyState>
                Nothing on your shelf yet. Read past the opening of any article
                and it lands here automatically — saved only in this browser.
              </EmptyState>
            ))
          )}
        </TabsContent>
        <TabsContent value="saved">
          {savedRows.length > 0 ? (
            <ul className="mt-3 flex list-none flex-col p-0">
              {savedRows.map((row) => (
                <ShelfArticleRow
                  accent={accentOf(row.meta.domain)}
                  badge={row.meta.archived ? <ArchivedBadge /> : undefined}
                  control={
                    <SaveButton
                      onToggle={(nowSaved) =>
                        handleUnsave(row.meta.slug, nowSaved)
                      }
                      slug={row.meta.slug}
                    />
                  }
                  href={row.meta.href}
                  key={row.meta.slug}
                  label={row.meta.label}
                  marker={
                    row.meta.kindPrefix + String(row.accession).padStart(2, "0")
                  }
                  progress={row.pct}
                  readingTime={row.meta.readingTime}
                  selection={toRowSelection(
                    rowSelection,
                    row.meta.slug,
                    row.meta.title
                  )}
                  tags={row.meta.tags}
                  timeText={`saved ${dayjs(row.savedAt).fromNow()}`}
                  title={row.meta.title}
                />
              ))}
            </ul>
          ) : (
            (filteredEmpty ?? (
              <EmptyState>
                Nothing saved yet. Use the bookmark control on any article or
                listing to keep it here for later.
              </EmptyState>
            ))
          )}
        </TabsContent>
      </Tabs>
      {compareMode && selected.length > 0 && (
        <CompareBar
          count={selected.length}
          onClear={() => setSelected([])}
          onCompare={startCompare}
        />
      )}
    </>
  );
}
