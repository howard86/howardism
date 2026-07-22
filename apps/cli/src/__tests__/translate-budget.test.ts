/**
 * Integration test: the TRANSLATE_MAX_USD cap halts the queue.
 *
 * Runs the translate CLI as a subprocess against a temp fixture with the cap
 * already met ($0), so every article must be reported as budget-skipped and NO
 * engine may be spawned — the engine is set to a name that does not exist on
 * PATH, so a spawn would surface as a failure instead of a skip.
 */
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SOURCE_MDX = `---
date: 2026-05-01
title: Budget Test Article
description: A test article.
tag: Tech
topic: software
readingTime: 3
imageAlt: test image
---

Body text for the test article.
`;

const CLI_ENTRY = join(import.meta.dir, "..", "translate", "index.ts");

let sourceDir: string;
let outputDir: string;
let projectionPath: string;
let glossaryPath: string;

async function runCli(env: Record<string, string>): Promise<string> {
  const proc = Bun.spawn(["bun", CLI_ENTRY], {
    env: {
      ...process.env,
      TARGET_LANG: "zh-TW",
      TRANSLATE_SOURCE_PATH: sourceDir,
      TRANSLATE_OUTPUT_PATH: outputDir,
      TRANSLATE_PROJECTION_PATH: projectionPath,
      GLOSSARY_DB_PATH: glossaryPath,
      TRANSLATE_TRACKING_DB_PATH: join(sourceDir, "tracking.db"),
      ...env,
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  await proc.exited;
  return `${stdout}\n${stderr}`;
}

beforeAll(async () => {
  sourceDir = await mkdtemp(join(tmpdir(), "translate-budget-source-"));
  outputDir = await mkdtemp(join(tmpdir(), "translate-budget-output-"));
  await writeFile(join(sourceDir, "alpha.mdx"), SOURCE_MDX);
  await writeFile(join(sourceDir, "beta.mdx"), SOURCE_MDX);
  projectionPath = join(sourceDir, "translations.json");
  glossaryPath = join(sourceDir, "glossary.db");
});

afterAll(async () => {
  await rm(sourceDir, { recursive: true, force: true });
  await rm(outputDir, { recursive: true, force: true });
});

describe("TRANSLATE_MAX_USD", () => {
  it("skips every queued article once the cap is already met", async () => {
    const output = await runCli({
      TRANSLATE_ENGINE: "agy",
      TRANSLATE_MAX_USD: "0",
    });
    expect(output).toContain("BUDGET CAP REACHED");
    expect(output).toContain("TRANSLATE_MAX_USD=$0.0000");
    expect(output).toContain("Budget-skipped: 2");
    expect(output).toContain("Translated:     0");
    // Nothing was attempted, so nothing can have failed.
    expect(output).toContain("Failed:         0");
    expect(output).not.toContain("starting (attempt 1)");
  });

  it("does not cap the queue when TRANSLATE_MAX_USD is unset", async () => {
    const output = await runCli({ TRANSLATE_ENGINE: "agy", DRY_RUN: "1" });
    expect(output).not.toContain("BUDGET CAP REACHED");
    expect(output).toContain("Budget-skipped: 0");
    expect(output).toContain("would translate alpha");
  });
});
