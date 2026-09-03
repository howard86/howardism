import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runWithConcurrency } from "../concurrency.ts";

const ITEM_COUNT = 40;
const CONCURRENCY = 8;

describe("images-to-webp transcode concurrency (O6)", () => {
  it("bounds in-flight work and aggregates correctly via a counter inside the worker", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    let done = 0;
    const progress: number[] = [];

    const items = Array.from({ length: ITEM_COUNT }, (_, i) => i);
    const results = await runWithConcurrency(items, CONCURRENCY, async (i) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve(); // yield, like an async transcode would
      inFlight -= 1;
      done += 1;
      progress.push(done); // the "N/total transcoded" counter's mechanism
      return { pngBytes: i + 1, webpBytes: i };
    });

    expect(maxInFlight).toBeLessThanOrEqual(CONCURRENCY);
    expect(progress).toHaveLength(ITEM_COUNT);
    expect(new Set(progress).size).toBe(ITEM_COUNT); // 1..N, no dupes/gaps

    // Order-preserving aggregation: totals line up with the input order
    // regardless of which worker finished a given item first.
    expect(results.map((r) => r.pngBytes)).toEqual(items.map((i) => i + 1));
    const pngTotal = results.reduce((sum, r) => sum + r.pngBytes, 0);
    expect(pngTotal).toBe(items.reduce((sum, i) => sum + i + 1, 0));
  });

  it("reads article files concurrently and keeps each result mapped to its own path", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webp-rewrite-reads-"));
    try {
      const paths = await Promise.all(
        Array.from({ length: 10 }, async (_, i) => {
          const path = join(dir, `article-${i}.mdx`);
          await writeFile(path, `content ${i}`);
          return path;
        })
      );

      const rawContents = await Promise.all(
        paths.map((path) => readFile(path, "utf8"))
      );

      expect(rawContents).toEqual(paths.map((_, i) => `content ${i}`));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
