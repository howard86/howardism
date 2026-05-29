/**
 * Integration test: `translate --check` exit behaviour.
 *
 * Builds a stale fixture (source MDX + output + projection with a mismatched
 * hash) then runs the CLI as a subprocess to verify:
 *   - `--check`         fails (exit 1) on drift.
 *   - `--check --warn`  reports drift as GitHub ::warning:: annotations, exit 0.
 */
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SOURCE_MDX = `---
date: 2026-05-01
title: Test Stale Article
description: A test article.
tag: Tech
topic: software
readingTime: 3
imageAlt: test image
---

Body text for the test article.
`;

const OUTPUT_MDX = `---
date: 2026-05-01
title: 測試過時文章
description: 一篇測試文章。
tag: Tech
topic: software
readingTime: 3
imageAlt: 測試圖片
---

正文測試。
`;

const CLI_ENTRY = join(import.meta.dir, "..", "translate", "index.ts");

async function runCli(
  args: string[],
  env: Record<string, string>
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", CLI_ENTRY, ...args], {
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  await proc.exited;
  return { stdout, stderr, exitCode: proc.exitCode ?? 0 };
}

let sourceDir: string;
let outputDir: string;
let projectionPath: string;

beforeAll(async () => {
  sourceDir = await mkdtemp(join(tmpdir(), "translate-warn-source-"));
  outputDir = await mkdtemp(join(tmpdir(), "translate-warn-output-"));

  await writeFile(join(sourceDir, "stale-article.mdx"), SOURCE_MDX);
  await writeFile(join(outputDir, "stale-article.mdx"), OUTPUT_MDX);

  // Bogus recorded hash so classifyArticle returns "stale" (actionable).
  const projection = {
    generatedOn: "2026-01-01",
    locale: "zh-TW",
    articles: {
      "stale-article": {
        sourceHash:
          "0000000000000000000000000000000000000000000000000000000000000000",
        sourceTitle: "Test Stale Article",
        engine: "agy",
        model: null,
        costUsd: null,
        credits: null,
        durationMs: 1000,
        translatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  };
  projectionPath = join(sourceDir, "translations.json");
  await writeFile(projectionPath, JSON.stringify(projection, null, 2));
});

afterAll(async () => {
  await rm(sourceDir, { recursive: true, force: true });
  await rm(outputDir, { recursive: true, force: true });
});

const BASE_ENV = (): Record<string, string> => ({
  TARGET_LANG: "zh-TW",
  TRANSLATE_SOURCE_PATH: sourceDir,
  TRANSLATE_OUTPUT_PATH: outputDir,
  TRANSLATE_PROJECTION_PATH: projectionPath,
});

describe("translate --check exit behaviour", () => {
  it("fails (exit 1) on drift without --warn", async () => {
    const { stdout, exitCode } = await runCli(["--check"], BASE_ENV());
    expect(exitCode).toBe(1);
    expect(stdout).toContain("Stale:");
    expect(stdout).not.toContain("::warning::");
  });

  it("warns (exit 0) on drift with --warn", async () => {
    const { stdout, exitCode } = await runCli(
      ["--check", "--warn"],
      BASE_ENV()
    );
    expect(exitCode).toBe(0);
    expect(stdout).toContain(
      "::warning::zh-TW translation stale: stale-article"
    );
  });
});
