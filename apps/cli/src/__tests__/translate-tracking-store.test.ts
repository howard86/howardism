import { Database } from "bun:sqlite";
import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { TranslationsManifestSchema } from "@howardism/article-contract/manifests/translations";

import {
  latestBySlug,
  openTrackingDb,
  recordRuns,
  spendByModel,
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

  it("round-trips the codex cost/token fields (cached tokens, reasoning, estimated cost)", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        {
          slug: "codex-slug",
          sourceHash: "h",
          engine: "codex",
          model: "gpt-5-codex",
          reasoningEffort: "high",
          costUsd: 0.05,
          costEstimated: true,
          inputTokens: 1000,
          outputTokens: 200,
          cachedInputTokens: 300,
          reasoningOutputTokens: 50,
          durationMs: 4000,
        },
      ]);
      const [row] = latestBySlug(db);
      expect(row.reasoningEffort).toBe("high");
      expect(row.costEstimated).toBe(true);
      expect(row.cachedInputTokens).toBe(300);
      expect(row.reasoningOutputTokens).toBe(50);
    } finally {
      db.close();
    }
  });

  it("defaults the new codex fields to null when omitted", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        { slug: "x", sourceHash: "h", engine: "kiro", durationMs: 5 },
      ]);
      const [row] = latestBySlug(db);
      expect(row.reasoningEffort).toBeNull();
      expect(row.costEstimated).toBeNull();
      expect(row.cachedInputTokens).toBeNull();
      expect(row.reasoningOutputTokens).toBeNull();
    } finally {
      db.close();
    }
  });
});

describe("spendByModel", () => {
  it("groups by model, sums tokens/cost/duration, and flags estimated cost", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        {
          slug: "a",
          sourceHash: "h1",
          engine: "codex",
          model: "gpt-5-codex",
          costUsd: 0.1,
          costEstimated: true,
          inputTokens: 100,
          outputTokens: 20,
          cachedInputTokens: 10,
          durationMs: 1000,
        },
        {
          slug: "b",
          sourceHash: "h2",
          engine: "codex",
          model: "gpt-5-codex",
          costUsd: 0.2,
          costEstimated: true,
          inputTokens: 200,
          outputTokens: 40,
          cachedInputTokens: 20,
          durationMs: 2000,
        },
        // Re-translation of "a" under the same model: same articles count, more runs.
        {
          slug: "a",
          sourceHash: "h1b",
          engine: "codex",
          model: "gpt-5-codex",
          costUsd: 0.05,
          costEstimated: true,
          inputTokens: 50,
          outputTokens: 10,
          durationMs: 500,
        },
        {
          slug: "c",
          sourceHash: "h3",
          engine: "claude",
          model: "claude-opus-4-7",
          costUsd: 1.5,
          inputTokens: 500,
          outputTokens: 300,
          durationMs: 3000,
        },
        // adopt run with no model, no tokens, no cost.
        { slug: "d", sourceHash: "h4", engine: "adopt", durationMs: 0 },
      ]);

      const summary = spendByModel(db);
      expect(summary.map((s) => s.model)).toEqual([
        "claude-opus-4-7",
        "gpt-5-codex",
        null,
      ]);

      const codex = summary.find((s) => s.model === "gpt-5-codex");
      expect(codex?.runs).toBe(3);
      expect(codex?.articles).toBe(2);
      expect(codex?.inputTokens).toBe(350);
      expect(codex?.outputTokens).toBe(70);
      expect(codex?.cachedInputTokens).toBe(30);
      expect(codex?.totalDurationMs).toBe(3500);
      expect(codex?.costUsd).toBeCloseTo(0.35);
      expect(codex?.estimated).toBe(true);

      const claude = summary.find((s) => s.model === "claude-opus-4-7");
      expect(claude?.runs).toBe(1);
      expect(claude?.costUsd).toBe(1.5);
      expect(claude?.estimated).toBe(false);

      const untracked = summary.find((s) => s.model === null);
      expect(untracked?.runs).toBe(1);
      expect(untracked?.costUsd).toBeNull();
      expect(untracked?.estimated).toBe(false);
      expect(untracked?.inputTokens).toBe(0);
    } finally {
      db.close();
    }
  });

  it("filters by locale", () => {
    const db = openTrackingDb(":memory:");
    try {
      recordRuns(db, [
        {
          slug: "a",
          sourceHash: "h",
          engine: "codex",
          model: "m",
          locale: "zh-TW",
          costUsd: 1,
          durationMs: 100,
        },
        {
          slug: "b",
          sourceHash: "h",
          engine: "codex",
          model: "m",
          locale: "ja",
          costUsd: 2,
          durationMs: 100,
        },
      ]);
      const ja = spendByModel(db, "ja");
      expect(ja).toHaveLength(1);
      expect(ja[0].costUsd).toBe(2);
    } finally {
      db.close();
    }
  });
});

describe("schema migration", () => {
  it("adds the new columns to a DB created under the old schema", async () => {
    const dir = await mkdtemp(join(tmpdir(), "tracking-migrate-"));
    const path = join(dir, "old.db");

    const oldDb = new Database(path, { create: true });
    oldDb.run(`
      CREATE TABLE translation_run (
        id            INTEGER PRIMARY KEY,
        slug          TEXT NOT NULL,
        locale        TEXT NOT NULL DEFAULT 'zh-TW',
        source_hash   TEXT NOT NULL,
        source_title  TEXT,
        engine        TEXT NOT NULL,
        model         TEXT,
        cost_usd      REAL,
        credits       REAL,
        input_tokens  INTEGER,
        output_tokens INTEGER,
        duration_ms   INTEGER NOT NULL,
        ran_at        TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    oldDb.run(
      "INSERT INTO translation_run (slug, source_hash, engine, duration_ms) VALUES (?, ?, ?, ?)",
      ["legacy-slug", "h0", "kiro", 10]
    );
    oldDb.close();

    const migrated = openTrackingDb(path);
    try {
      const columns = (
        migrated.query("PRAGMA table_info(translation_run)").all() as {
          name: string;
        }[]
      ).map((c) => c.name);
      for (const col of [
        "cached_input_tokens",
        "reasoning_output_tokens",
        "cost_estimated",
        "reasoning_effort",
      ]) {
        expect(columns).toContain(col);
      }

      // The pre-existing row survives the migration with nulls for new columns.
      const legacy = latestBySlug(migrated).find(
        (r) => r.slug === "legacy-slug"
      );
      expect(legacy?.cachedInputTokens).toBeNull();
      expect(legacy?.reasoningEffort).toBeNull();

      // Inserting against the migrated schema works end-to-end.
      recordRuns(migrated, [
        {
          slug: "new-slug",
          sourceHash: "h1",
          engine: "codex",
          model: "gpt-5-codex",
          reasoningEffort: "medium",
          costEstimated: true,
          cachedInputTokens: 5,
          reasoningOutputTokens: 7,
          durationMs: 20,
        },
      ]);
      const fresh = latestBySlug(migrated).find((r) => r.slug === "new-slug");
      expect(fresh?.reasoningEffort).toBe("medium");
      expect(fresh?.costEstimated).toBe(true);
      expect(fresh?.cachedInputTokens).toBe(5);
      expect(fresh?.reasoningOutputTokens).toBe(7);
    } finally {
      migrated.close();
    }
  });
});

describe("TranslationRecordSchema backward compatibility", () => {
  it("parses a manifest record from before costEstimated existed", () => {
    const manifest = {
      generatedOn: "2026-01-01",
      locale: "zh-TW",
      articles: {
        "legacy-slug": {
          sourceHash: "h",
          sourceTitle: "Title",
          engine: "kiro",
          model: null,
          costUsd: null,
          credits: null,
          durationMs: 1000,
          translatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    };
    const parsed = TranslationsManifestSchema.parse(manifest);
    expect(parsed.articles["legacy-slug"].costEstimated).toBeUndefined();
  });
});
