import type {
  NoteHistory,
  ReleaseEntry,
} from "@howardism/article-contract/manifests/release-history";

/**
 * Pure derivations over the release-history manifest. They take plain data (no
 * manifest import, no `server-only`) so they can be unit-tested directly; the
 * memoised readers live in `service.ts`.
 */

export interface SourceGroup {
  /** Notes filed in this release under this source. */
  new: string[];
  /** Notes revised in this release under this source. */
  revised: string[];
  title: string;
  /** Notes in the release that gained this source (before one-source grouping). */
  touched: number;
}

export interface IssueGroups {
  groups: SourceGroup[];
  /** New/revised notes that gained no source this release. */
  upkeep: string[];
}

const byTitle = (a: string, b: string) => a.localeCompare(b);

/**
 * Source title → the visible new/revised slugs of `entry` that gained it.
 */
export function touchesBySource(
  entry: ReleaseEntry,
  isVisible: (slug: string) => boolean
): Map<string, Set<string>> {
  const touches = new Map<string, Set<string>>();
  for (const slug of [...entry.new, ...entry.revised]) {
    if (!isVisible(slug)) {
      continue;
    }
    for (const title of entry.sourcesGained[slug] ?? []) {
      const set = touches.get(title);
      if (set) {
        set.add(slug);
      } else {
        touches.set(title, new Set([slug]));
      }
    }
  }
  return touches;
}

/**
 * File each new/revised note under exactly one source: of the sources it
 * gained, the one that touched the most notes in this release (ties:
 * alphabetical title). Notes with no gained source become upkeep. Groups run
 * by notes touched desc, then title.
 */
export function groupBySource(
  entry: ReleaseEntry,
  isVisible: (slug: string) => boolean
): IssueGroups {
  const touches = touchesBySource(entry, isVisible);
  const touchedCount = (title: string) => touches.get(title)?.size ?? 0;
  const groups = new Map<string, SourceGroup>();
  const upkeep: string[] = [];

  const assign = (slug: string, kind: "new" | "revised") => {
    const gained = entry.sourcesGained[slug] ?? [];
    if (gained.length === 0) {
      upkeep.push(slug);
      return;
    }
    const [best] = [...gained].sort(
      (a, b) => touchedCount(b) - touchedCount(a) || byTitle(a, b)
    );
    let group = groups.get(best);
    if (!group) {
      group = {
        title: best,
        new: [],
        revised: [],
        touched: touchedCount(best),
      };
      groups.set(best, group);
    }
    group[kind].push(slug);
  };

  for (const slug of entry.new) {
    if (isVisible(slug)) {
      assign(slug, "new");
    }
  }
  for (const slug of entry.revised) {
    if (isVisible(slug)) {
      assign(slug, "revised");
    }
  }

  return {
    groups: [...groups.values()].sort(
      (a, b) => b.touched - a.touched || byTitle(a.title, b.title)
    ),
    upkeep,
  };
}

export interface RecentSource {
  /** Release number it was most recently processed in. */
  no: number;
  title: string;
  /** Notes it touched in that release. */
  touched: number;
}

/**
 * Sources processed across `releases` (newest first), a source counting as
 * processed in a release when it appears in that release's `sourcesGained`.
 * Deduped keeping the newest release; within a release, by notes touched desc.
 */
export function recentSources(
  releases: readonly ReleaseEntry[],
  isVisible: (slug: string) => boolean,
  limit: number
): RecentSource[] {
  const seen = new Set<string>();
  const out: RecentSource[] = [];
  for (const entry of releases) {
    const touches = touchesBySource(entry, isVisible);
    const ordered = [...touches.entries()].sort(
      (a, b) => b[1].size - a[1].size || byTitle(a[0], b[0])
    );
    for (const [title, slugs] of ordered) {
      if (!seen.has(title)) {
        seen.add(title);
        out.push({ title, no: entry.no, touched: slugs.size });
      }
    }
  }
  return out.slice(0, limit);
}

/** The most recent revision date for a note, else undefined. */
export const lastRevision = (
  history: NoteHistory | undefined
): string | undefined => history?.revisions.at(-1);

/** Epoch ms of a note's latest activity: last revision, else its filed date. */
export const latestActivityMs = (
  filedDate: string,
  history: NoteHistory | undefined
): number => Date.parse(lastRevision(history) ?? filedDate);

/** Stable sort of `items` by latest activity, newest first. */
export function sortByActivity<T>(
  items: readonly T[],
  activityMs: (item: T) => number
): T[] {
  return items
    .map((item, index) => ({ item, index, ms: activityMs(item) }))
    .sort((a, b) => b.ms - a.ms || a.index - b.index)
    .map((entry) => entry.item);
}

export const SPARK_WEEKS = 8;
export const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Weekly event counts over `SPARK_WEEKS` weeks, oldest → newest, the last week
 * ending at `anchorMs`. Events outside the window are dropped.
 */
export function weeklyBars(events: Iterable<number>, anchorMs: number) {
  const bars: number[] = new Array(SPARK_WEEKS).fill(0);
  const start = anchorMs - (SPARK_WEEKS - 1) * MS_PER_WEEK;
  for (const ms of events) {
    const week = Math.floor((ms - start) / MS_PER_WEEK);
    if (week >= 0 && week < SPARK_WEEKS) {
      bars[week] += 1;
    }
  }
  return bars;
}

export interface DomainIssueStat {
  /** Visible notes of this domain that were new or revised. */
  slugs: string[];
  /** The source touching the most of those notes, when any gained one. */
  topSource?: { title: string; touched: number };
}

/**
 * Per-domain release stats. `domainOf` returns a note's domain or undefined
 * for notes outside every domain (MOCs, hidden pages), which are skipped.
 */
export function domainIssueStats<D extends string>(
  entry: ReleaseEntry,
  domainOf: (slug: string) => D | undefined
): Map<D, DomainIssueStat> {
  const stats = new Map<D, DomainIssueStat>();
  const perSource = new Map<D, Map<string, number>>();
  for (const slug of [...entry.new, ...entry.revised]) {
    const domain = domainOf(slug);
    if (!domain) {
      continue;
    }
    let stat = stats.get(domain);
    if (!stat) {
      stat = { slugs: [] };
      stats.set(domain, stat);
      perSource.set(domain, new Map());
    }
    stat.slugs.push(slug);
    const counts = perSource.get(domain);
    for (const title of entry.sourcesGained[slug] ?? []) {
      counts?.set(title, (counts.get(title) ?? 0) + 1);
    }
  }
  for (const [domain, counts] of perSource) {
    const [top] = [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || byTitle(a[0], b[0])
    );
    const stat = stats.get(domain);
    if (top && stat) {
      stat.topSource = { title: top[0], touched: top[1] };
    }
  }
  return stats;
}
