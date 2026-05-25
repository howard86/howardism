/**
 * Integration test: stale-skip behaviour in processArticle.
 *
 * Creates a minimal temp fixture (source MDX + existing output + projection
 * with a mismatched hash) then runs the translate CLI as a subprocess to
 * verify:
 *   - default (no --update): stale article is skipped
 *   - --update: stale article would be translated (DRY_RUN)
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
  env: Record<string, string>
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", CLI_ENTRY], {
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
  sourceDir = await mkdtemp(join(tmpdir(), "translate-stale-source-"));
  outputDir = await mkdtemp(join(tmpdir(), "translate-stale-output-"));

  await writeFile(join(sourceDir, "stale-article.mdx"), SOURCE_MDX);
  await writeFile(join(outputDir, "stale-article.mdx"), OUTPUT_MDX);

  // Use a bogus hash so classifyArticle returns "stale"
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

const BASE_ENV: Record<string, string> = {
  DRY_RUN: "1",
  TRANSLATE_ENGINE: "agy",
  TARGET_LANG: "zh-TW",
};

describe("stale-skip behaviour", () => {
  it("skips stale articles by default (no --update)", async () => {
    const { stdout } = await runCli({
      ...BASE_ENV,
      TRANSLATE_SOURCE_PATH: sourceDir,
      TRANSLATE_OUTPUT_PATH: outputDir,
      TRANSLATE_PROJECTION_PATH: projectionPath,
    });
    expect(stdout).toContain(
      "skip stale-article (stale — run with --update to refresh)"
    );
    expect(stdout).not.toContain("would translate stale-article");
    expect(stdout).toContain(
      "Stale-skipped:  1 (run with --update to refresh)"
    );
  });

  it("translates stale articles when --update is passed", async () => {
    const { stdout } = await runCli({
      ...BASE_ENV,
      TRANSLATE_UPDATE: "1",
      TRANSLATE_SOURCE_PATH: sourceDir,
      TRANSLATE_OUTPUT_PATH: outputDir,
      TRANSLATE_PROJECTION_PATH: projectionPath,
    });
    expect(stdout).toContain("would translate stale-article");
    expect(stdout).not.toContain(
      "skip stale-article (stale — run with --update to refresh)"
    );
  });
});
