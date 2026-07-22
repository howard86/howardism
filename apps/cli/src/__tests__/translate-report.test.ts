import { describe, expect, it } from "bun:test";

import { buildReport, printReport } from "../translate/report.ts";
import { openTrackingDb, recordRuns } from "../translate/tracking/store.ts";

const ESTIMATED_TOTAL_RE = /Cost:\s+\$2\.0000\*/;
const REPORTED_TOTAL_RE = /Cost:\s+\$1\.5000$/m;

describe("buildReport", () => {
  it("returns an empty report when the DB has no rows for the locale", () => {
    const db = openTrackingDb(":memory:");
    try {
      const report = buildReport(db);
      expect(report.empty).toBe(true);
      expect(report.models).toEqual([]);
      expect(report.topArticles).toEqual([]);
      expect(report.anyPriceConfigured).toBe(false);
      expect(report.totals).toEqual({
        runs: 0,
        articles: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
        durationMs: 0,
        costUsd: null,
      });
    } finally {
      db.close();
    }
  });

  it("is empty for a locale with no rows even when other locales have runs", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        {
          slug: "a",
          sourceHash: "h",
          engine: "codex",
          model: "m",
          locale: "ja",
          durationMs: 100,
        },
      ]);
      const report = buildReport(db, { locale: "zh-TW" });
      expect(report.empty).toBe(true);
    } finally {
      db.close();
    }
  });

  it("groups by model, sums tokens/duration, computes cache-hit rate, and counts distinct articles across models", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        {
          slug: "boris-cherny",
          sourceHash: "h1",
          engine: "codex",
          model: "gpt-5-codex",
          inputTokens: 1000,
          cachedInputTokens: 400,
          outputTokens: 200,
          durationMs: 1000,
        },
        {
          slug: "cat-wu",
          sourceHash: "h2",
          engine: "codex",
          model: "gpt-5-codex",
          inputTokens: 500,
          cachedInputTokens: 100,
          outputTokens: 100,
          durationMs: 2000,
        },
        // Re-translation of boris under a DIFFERENT model — must not double
        // count boris in the distinct-article total.
        {
          slug: "boris-cherny",
          sourceHash: "h1b",
          engine: "claude",
          model: "claude-opus-4-7",
          costUsd: 1.5,
          inputTokens: 300,
          outputTokens: 50,
          durationMs: 500,
        },
      ]);

      const report = buildReport(db);
      expect(report.empty).toBe(false);

      const codex = report.models.find((m) => m.model === "gpt-5-codex");
      expect(codex?.runs).toBe(2);
      expect(codex?.articles).toBe(2);
      expect(codex?.inputTokens).toBe(1500);
      expect(codex?.cachedInputTokens).toBe(500);
      expect(codex?.outputTokens).toBe(300);
      expect(codex?.totalDurationMs).toBe(3000);
      expect(codex?.cacheHitRate).toBeCloseTo(500 / 1500);
      expect(codex?.costUsd).toBeNull();

      const claude = report.models.find((m) => m.model === "claude-opus-4-7");
      expect(claude?.cacheHitRate).toBe(0);

      // Distinct articles across the whole report: boris-cherny + cat-wu = 2,
      // NOT 3 (which summing each model's `articles` column would give).
      expect(report.totals.articles).toBe(2);
      expect(report.totals.runs).toBe(3);
      expect(report.totals.inputTokens).toBe(1800);
      expect(report.totals.outputTokens).toBe(350);
      expect(report.totals.durationMs).toBe(3500);
      expect(report.totals.costUsd).toBeCloseTo(1.5);
    } finally {
      db.close();
    }
  });

  it("retroactively prices a model via TRANSLATE_PRICING when no cost was recorded, and flags it estimated", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        {
          slug: "boris-cherny",
          sourceHash: "h1",
          engine: "codex",
          model: "gpt-5-codex",
          inputTokens: 1_000_000,
          cachedInputTokens: 400_000,
          outputTokens: 100_000,
          durationMs: 1000,
        },
      ]);

      const priced = buildReport(db, {
        env: {
          TRANSLATE_PRICING: JSON.stringify({
            "gpt-5-codex": {
              inputPerMTok: 1,
              cachedInputPerMTok: 0.1,
              outputPerMTok: 10,
            },
          }),
        },
      });
      const codex = priced.models.find((m) => m.model === "gpt-5-codex");
      // cached: 400_000*0.1/1e6=0.04; uncached: 600_000*1/1e6=0.6; output: 100_000*10/1e6=1
      expect(codex?.costUsd).toBeCloseTo(0.04 + 0.6 + 1);
      expect(codex?.estimated).toBe(true);
      expect(priced.anyPriceConfigured).toBe(true);
      expect(priced.topArticles[0]?.costUsd).toBeCloseTo(0.04 + 0.6 + 1);
      expect(priced.topArticles[0]?.estimated).toBe(true);

      const unpriced = buildReport(db);
      const unpricedCodex = unpriced.models.find(
        (m) => m.model === "gpt-5-codex"
      );
      expect(unpricedCodex?.costUsd).toBeNull();
      expect(unpricedCodex?.estimated).toBe(false);
      expect(unpriced.anyPriceConfigured).toBe(false);
    } finally {
      db.close();
    }
  });

  it("ranks top articles by tokens (not cost) when no run in the report has a recorded cost", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        {
          slug: "small",
          sourceHash: "h1",
          engine: "codex",
          inputTokens: 100,
          outputTokens: 10,
          durationMs: 100,
        },
        {
          slug: "big",
          sourceHash: "h2",
          engine: "codex",
          inputTokens: 900,
          outputTokens: 90,
          durationMs: 100,
        },
      ]);
      const report = buildReport(db);
      expect(report.topRankedBy).toBe("tokens");
      expect(report.topArticles.map((a) => a.slug)).toEqual(["big", "small"]);
    } finally {
      db.close();
    }
  });

  it("ranks top articles by cost, ordering unpriced runs last, once any cost is recorded", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        {
          slug: "cheap",
          sourceHash: "h1",
          engine: "claude",
          costUsd: 0.1,
          durationMs: 100,
        },
        {
          slug: "no-cost",
          sourceHash: "h2",
          engine: "agy",
          durationMs: 100,
        },
        {
          slug: "expensive",
          sourceHash: "h3",
          engine: "claude",
          costUsd: 5,
          durationMs: 100,
        },
      ]);
      const report = buildReport(db);
      expect(report.topRankedBy).toBe("cost");
      expect(report.topArticles.map((a) => a.slug)).toEqual([
        "expensive",
        "cheap",
        "no-cost",
      ]);
    } finally {
      db.close();
    }
  });

  it("respects the top option, limiting and ordering the slice", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        {
          slug: "a",
          sourceHash: "h",
          engine: "codex",
          inputTokens: 10,
          durationMs: 1,
        },
        {
          slug: "b",
          sourceHash: "h",
          engine: "codex",
          inputTokens: 30,
          durationMs: 1,
        },
        {
          slug: "c",
          sourceHash: "h",
          engine: "codex",
          inputTokens: 20,
          durationMs: 1,
        },
      ]);
      const report = buildReport(db, { top: 2 });
      expect(report.topArticles).toHaveLength(2);
      expect(report.topArticles.map((a) => a.slug)).toEqual(["b", "c"]);
    } finally {
      db.close();
    }
  });
});

describe("printReport", () => {
  const capture = (fn: () => void): string => {
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.join(" "));
    };
    try {
      fn();
    } finally {
      console.log = originalLog;
    }
    return lines.join("\n");
  };

  it("marks the Totals cost as estimated when the contributing rows are estimates", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        {
          slug: "boris-cherny",
          sourceHash: "h1",
          engine: "codex",
          model: "gpt-5.6-luna",
          inputTokens: 1_000_000,
          outputTokens: 100_000,
          durationMs: 1000,
        },
      ]);
      const env = {
        TRANSLATE_PRICING: JSON.stringify({
          "gpt-5.6-luna": { inputPerMTok: 1, outputPerMTok: 10 },
        }),
      };
      const output = capture(() => printReport(buildReport(db, { env })));
      expect(output).toMatch(ESTIMATED_TOTAL_RE);
    } finally {
      db.close();
    }
  });

  it("leaves the Totals cost unmarked when the engine reported a real cost", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        {
          slug: "boris-cherny",
          sourceHash: "h1",
          engine: "claude",
          model: "claude-opus-4-7",
          costUsd: 1.5,
          durationMs: 1000,
        },
      ]);
      const output = capture(() => printReport(buildReport(db)));
      expect(output).toMatch(REPORTED_TOTAL_RE);
    } finally {
      db.close();
    }
  });

  it("does not throw for an empty report or a populated one", () => {
    const db = openTrackingDb(":memory:");
    try {
      const originalLog = console.log;
      console.log = () => {
        // swallow output — this is a smoke test, not a snapshot of stdout.
      };
      try {
        expect(() => printReport(buildReport(db))).not.toThrow();

        recordRuns(db, [
          {
            slug: "boris-cherny",
            sourceHash: "h1",
            engine: "codex",
            model: "gpt-5-codex",
            inputTokens: 1000,
            cachedInputTokens: 400,
            outputTokens: 200,
            durationMs: 1000,
          },
        ]);
        expect(() => printReport(buildReport(db))).not.toThrow();
      } finally {
        console.log = originalLog;
      }
    } finally {
      db.close();
    }
  });
});
