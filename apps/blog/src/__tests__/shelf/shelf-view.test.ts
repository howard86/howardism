import { describe, expect, it } from "bun:test";

import {
  BUCKET_LABELS,
  bucketOf,
  computeShelfStats,
  DONE_PCT,
  isInProgress,
  SHELF_SORT_COMPARATORS,
  type ShelfRead,
} from "@/lib/shelf-view";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NOW = 1_800_000_000_000;

const read = (overrides: Partial<ShelfRead>): ShelfRead => ({
  lastReadAt: NOW - HOUR,
  pct: 1,
  readingTime: 10,
  ...overrides,
});

describe("bucketOf", () => {
  it("assigns rolling 24h windows to the five buckets", () => {
    expect(bucketOf(NOW - 23 * HOUR, NOW)).toBe(0); // Today
    expect(bucketOf(NOW - 24 * HOUR, NOW)).toBe(1); // Yesterday
    expect(bucketOf(NOW - 47 * HOUR, NOW)).toBe(1);
    expect(bucketOf(NOW - 48 * HOUR, NOW)).toBe(2); // Earlier this week
    expect(bucketOf(NOW - 6 * DAY, NOW)).toBe(2);
    expect(bucketOf(NOW - 7 * DAY, NOW)).toBe(3); // Earlier this month
    expect(bucketOf(NOW - 30 * DAY, NOW)).toBe(3);
    expect(bucketOf(NOW - 31 * DAY, NOW)).toBe(4); // Older
  });

  it("has a label for every bucket", () => {
    expect(BUCKET_LABELS).toHaveLength(5);
  });
});

describe("SHELF_SORT_COMPARATORS", () => {
  const older = read({ lastReadAt: NOW - 2 * DAY, pct: 0.5, readingTime: 20 });
  const newer = read({ lastReadAt: NOW - HOUR, pct: 0.3, readingTime: 5 });
  const newest = read({ lastReadAt: NOW, pct: 0.3, readingTime: 5 });

  it("recent orders by last read, newest first", () => {
    expect([older, newer].sort(SHELF_SORT_COMPARATORS.recent)).toEqual([
      newer,
      older,
    ]);
  });

  it("progress orders by pct, ties broken by recency", () => {
    expect(
      [newer, older, newest].sort(SHELF_SORT_COMPARATORS.progress)
    ).toEqual([older, newest, newer]);
  });

  it("longest orders by reading time, ties broken by recency", () => {
    expect([newer, older, newest].sort(SHELF_SORT_COMPARATORS.longest)).toEqual(
      [older, newest, newer]
    );
  });
});

describe("computeShelfStats", () => {
  it("counts reads, the last week, and estimated hours", () => {
    const stats = computeShelfStats(
      [
        read({ lastReadAt: NOW - HOUR, pct: 1, readingTime: 30 }),
        read({ lastReadAt: NOW - 2 * DAY, pct: 0.5, readingTime: 60 }),
        read({ lastReadAt: NOW - 10 * DAY, pct: 1, readingTime: 30 }),
      ],
      NOW
    );
    expect(stats.notesRead).toBe(3);
    expect(stats.thisWeek).toBe(2);
    // 30×1 + 60×0.5 + 30×1 minutes = 1.5 hrs
    expect(stats.hours).toBe(1.5);
  });

  it("caps a read's contribution to hours at its full reading time", () => {
    const stats = computeShelfStats([read({ pct: 1.2, readingTime: 60 })], NOW);
    expect(stats.hours).toBe(1);
  });

  it("walks the streak back from today until the first empty day", () => {
    const stats = computeShelfStats(
      [
        read({ lastReadAt: NOW - HOUR }), // day 0
        read({ lastReadAt: NOW - 30 * HOUR }), // day 1
        // day 2 empty
        read({ lastReadAt: NOW - 3 * DAY - HOUR }), // day 3
      ],
      NOW
    );
    expect(stats.streakDays).toBe(2);
  });

  it("reports a zero streak when nothing was read today", () => {
    const stats = computeShelfStats([read({ lastReadAt: NOW - 2 * DAY })], NOW);
    expect(stats.streakDays).toBe(0);
  });

  it("returns zeroes for an empty history", () => {
    expect(computeShelfStats([], NOW)).toEqual({
      notesRead: 0,
      thisWeek: 0,
      hours: 0,
      streakDays: 0,
    });
  });
});

describe("isInProgress", () => {
  it("treats reads below the done threshold as resumable", () => {
    expect(isInProgress(DONE_PCT - 0.01)).toBe(true);
    expect(isInProgress(DONE_PCT)).toBe(false);
    expect(isInProgress(1)).toBe(false);
  });
});
