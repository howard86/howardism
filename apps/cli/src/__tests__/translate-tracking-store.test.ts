import { describe, expect, it } from "bun:test";

import {
  latestBySlug,
  openTrackingDb,
  recordRuns,
} from "../translate/tracking/store.ts";

describe("tracking store", () => {
  it("records runs and returns the latest per slug", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        {
          slug: "boris-cherny",
          sourceHash: "h1",
          engine: "kiro",
          costUsd: null,
          durationMs: 1000,
        },
        {
          slug: "cat-wu",
          sourceHash: "h2",
          engine: "claude",
          costUsd: 0.12,
          durationMs: 2000,
        },
        // A re-translation of boris with a newer hash + recorded cost.
        {
          slug: "boris-cherny",
          sourceHash: "h1b",
          engine: "claude",
          model: "claude-opus-4-7[1m]",
          costUsd: 0.34,
          durationMs: 3000,
        },
      ]);

      const latest = latestBySlug(db);
      expect(latest.map((r) => r.slug)).toEqual(["boris-cherny", "cat-wu"]);
      const boris = latest.find((r) => r.slug === "boris-cherny");
      expect(boris?.sourceHash).toBe("h1b");
      expect(boris?.engine).toBe("claude");
      expect(boris?.costUsd).toBe(0.34);
      expect(boris?.model).toBe("claude-opus-4-7[1m]");
    } finally {
      db.close();
    }
  });

  it("defaults locale to zh-TW and persists null cost", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        { slug: "x", sourceHash: "h", engine: "agy", durationMs: 5 },
      ]);
      const [row] = latestBySlug(db);
      expect(row.locale).toBe("zh-TW");
      expect(row.costUsd).toBeNull();
    } finally {
      db.close();
    }
  });

  it("recordRuns on an empty list is a no-op", () => {
    const db = openTrackingDb(":memory:");
    try {
      expect(recordRuns(db, []).added).toBe(0);
      expect(latestBySlug(db)).toEqual([]);
    } finally {
      db.close();
    }
  });
});
