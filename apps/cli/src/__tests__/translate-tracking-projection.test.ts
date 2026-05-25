import { describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  readProjection,
  recordedHashOf,
  type TranslationRecord,
  writeProjection,
} from "../translate/tracking/projection.ts";

const record = (over: Partial<TranslationRecord> = {}): TranslationRecord => ({
  sourceHash: "h",
  sourceTitle: "Title",
  engine: "kiro",
  model: null,
  costUsd: null,
  credits: null,
  durationMs: 1000,
  translatedAt: "2026-05-25T00:00:00.000Z",
  ...over,
});

describe("projection", () => {
  it("returns an empty projection when the file is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "proj-"));
    const proj = await readProjection(join(dir, "translations.json"));
    expect(proj.locale).toBe("zh-TW");
    expect(proj.articles).toEqual({});
  });

  it("merges updates over existing entries, preserving untouched slugs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "proj-"));
    const path = join(dir, "translations.json");

    const first = await readProjection(path);
    await writeProjection(path, first, {
      "boris-cherny": record({ sourceHash: "h-boris" }),
      "cat-wu": record({ sourceHash: "h-cat" }),
    });

    // Re-read (durable), then update only boris.
    const reloaded = await readProjection(path);
    expect(recordedHashOf(reloaded, "boris-cherny")).toBe("h-boris");
    expect(recordedHashOf(reloaded, "cat-wu")).toBe("h-cat");

    await writeProjection(path, reloaded, {
      "boris-cherny": record({ sourceHash: "h-boris-2", costUsd: 0.5 }),
    });

    const final = await readProjection(path);
    expect(recordedHashOf(final, "boris-cherny")).toBe("h-boris-2");
    expect(final.articles["boris-cherny"].costUsd).toBe(0.5);
    // cat-wu was untouched but preserved.
    expect(recordedHashOf(final, "cat-wu")).toBe("h-cat");
  });

  it("writes article keys sorted for stable diffs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "proj-"));
    const path = join(dir, "translations.json");
    const empty = await readProjection(path);
    const written = await writeProjection(path, empty, {
      zebra: record(),
      apple: record(),
    });
    expect(Object.keys(written.articles)).toEqual(["apple", "zebra"]);
  });

  it("recordedHashOf returns null for an unknown slug", async () => {
    const dir = await mkdtemp(join(tmpdir(), "proj-"));
    const proj = await readProjection(join(dir, "translations.json"));
    expect(recordedHashOf(proj, "nope")).toBeNull();
  });
});
