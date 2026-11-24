import { describe, expect, it } from "bun:test";

import type { ReleaseEntry } from "@howardism/article-contract/manifests/release-history";

import {
  domainIssueStats,
  groupBySource,
  latestActivityMs,
  MS_PER_WEEK,
  recentSources,
  sortByActivity,
  weeklyBars,
} from "./release-view";

const entry = (over: Partial<ReleaseEntry> = {}): ReleaseEntry => ({
  date: "2026-11-01",
  new: [],
  no: 5,
  resolved: [],
  revised: [],
  sourcesGained: {},
  ...over,
});

const all = () => true;

describe("groupBySource", () => {
  it("files a note under the gained source that touched the most notes", () => {
    const e = entry({
      new: ["a"],
      revised: ["b", "c"],
      sourcesGained: { a: ["Big", "Small"], b: ["Big"], c: ["Small"] },
    });
    const { groups, upkeep } = groupBySource(e, all);
    expect(groups.map((g) => g.title)).toEqual(["Big", "Small"]);
    expect(groups[0]).toMatchObject({ new: ["a"], revised: ["b"], touched: 2 });
    expect(groups[1]).toMatchObject({ new: [], revised: ["c"] });
    expect(upkeep).toEqual([]);
  });

  it("breaks ties alphabetically and sends source-less notes to upkeep", () => {
    const e = entry({
      new: ["a"],
      revised: ["b"],
      sourcesGained: { a: ["Zed", "Alpha"] },
    });
    const { groups, upkeep } = groupBySource(e, all);
    expect(groups.map((g) => g.title)).toEqual(["Alpha"]);
    expect(upkeep).toEqual(["b"]);
  });

  it("ignores slugs that are not visible", () => {
    const e = entry({
      revised: ["a", "hidden"],
      sourcesGained: { a: ["S"], hidden: ["S", "T"] },
    });
    const { groups, upkeep } = groupBySource(e, (s) => s !== "hidden");
    expect(groups).toHaveLength(1);
    expect(groups[0].touched).toBe(1);
    expect(upkeep).toEqual([]);
  });
});

describe("recentSources", () => {
  const newer = entry({
    no: 6,
    new: ["a"],
    revised: ["b"],
    sourcesGained: { a: ["S1"], b: ["S1", "S2"] },
  });
  const older = entry({
    no: 5,
    revised: ["c"],
    sourcesGained: { c: ["S2", "S3"] },
  });

  it("dedupes keeping the newest release and counts touched notes", () => {
    expect(recentSources([newer, older], all, 10)).toEqual([
      { title: "S1", no: 6, touched: 2 },
      { title: "S2", no: 6, touched: 1 },
      { title: "S3", no: 5, touched: 1 },
    ]);
  });

  it("caps the list", () => {
    expect(recentSources([newer, older], all, 2)).toHaveLength(2);
  });
});

describe("domainIssueStats", () => {
  it("groups touched notes per domain with the top source", () => {
    const e = entry({
      new: ["a"],
      revised: ["b", "c", "d"],
      sourcesGained: { a: ["X"], b: ["X", "Y"], c: ["Y"], d: ["Y"] },
    });
    const domains: Record<string, string> = { a: "p", b: "p", c: "q" };
    const stats = domainIssueStats(e, (s) => domains[s]);
    expect(stats.get("p")).toEqual({
      slugs: ["a", "b"],
      topSource: { title: "X", touched: 2 },
    });
    expect(stats.get("q")?.topSource).toEqual({ title: "Y", touched: 1 });
    expect(stats.size).toBe(2);
  });
});

describe("activity ordering", () => {
  it("prefers the last revision over the filed date", () => {
    expect(
      latestActivityMs("2026-01-01", {
        first: "2026-01-01",
        revised: "2026-03-01",
        revisions: ["2026-02-01", "2026-03-01"],
      })
    ).toBe(Date.parse("2026-03-01"));
    expect(latestActivityMs("2026-01-01", undefined)).toBe(
      Date.parse("2026-01-01")
    );
  });

  it("sorts newest first and keeps ties stable", () => {
    const ms: Record<string, number> = { a: 1, b: 3, c: 3, d: 2 };
    expect(sortByActivity(["a", "b", "c", "d"], (s) => ms[s])).toEqual([
      "b",
      "c",
      "d",
      "a",
    ]);
  });
});

describe("weeklyBars", () => {
  it("buckets events into 8 weeks ending at the anchor", () => {
    const anchor = Date.parse("2026-11-01");
    const bars = weeklyBars(
      [
        anchor,
        anchor - MS_PER_WEEK,
        anchor - MS_PER_WEEK,
        anchor - 20 * MS_PER_WEEK,
      ],
      anchor
    );
    expect(bars).toHaveLength(8);
    expect(bars[7]).toBe(1);
    expect(bars[6]).toBe(2);
    expect(bars.reduce((a, b) => a + b, 0)).toBe(3);
  });
});
