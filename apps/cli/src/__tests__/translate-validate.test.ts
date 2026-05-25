import { describe, expect, it } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { validateTranslation } from "../translate/validate.ts";

const SLUG = "boris-cherny";

const IMAGE_ALT_LINE_RE = /imageAlt: Boris Cherny 的插圖\n/;

const SOURCE_MDX = `---
date: 2026-05-23
title: Boris Cherny
description: Lead engineer on Claude Code
tag: Entity
topic: orgs
tags:
  - entity
  - person
  - anthropic
readingTime: 5
imageAlt: Illustration for Boris Cherny
sources:
  - title: Anthropic's Boris Cherny on Coding
    url: https://example.com/boris
---
export { default as heroImage } from "../assets/${SLUG}.png";

## Summary

Boris is the IC voice on Claude Code at Anthropic.
`;

const TRANSLATED_MDX = `---
date: 2026-05-23
title: 鮑里斯·切爾尼
description: Claude Code 的首席工程師
tag: Entity
topic: orgs
tags:
  - entity
  - person
  - anthropic
readingTime: 5
imageAlt: Boris Cherny 的插圖
sources:
  - title: Anthropic's Boris Cherny on Coding
    url: https://example.com/boris
---
export { default as heroImage } from "../assets/${SLUG}.png";

## 摘要

Boris 是 Anthropic 在 Claude Code 上的 IC 代表聲音。
`;

interface Fixture {
  outputPath: string;
  sourcePath: string;
}

const writeFixture = async (outputBody: string): Promise<Fixture> => {
  const dir = await mkdtemp(join(tmpdir(), "translate-validate-"));
  const sourcePath = join(dir, `${SLUG}.mdx`);
  // Output is nested under `out/` so source and output share `${SLUG}.mdx`
  // basenames, matching how the orchestrator names sibling output files.
  const outputPath = join(dir, "out", `${SLUG}.mdx`);
  await writeFile(sourcePath, SOURCE_MDX, "utf8");
  await Bun.write(outputPath, outputBody);
  return { sourcePath, outputPath };
};

describe("validateTranslation", () => {
  it("passes for a valid translated MDX", async () => {
    const { sourcePath, outputPath } = await writeFixture(TRANSLATED_MDX);
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("fails when the output file does not exist", async () => {
    const dir = await mkdtemp(join(tmpdir(), "translate-validate-"));
    const sourcePath = join(dir, `${SLUG}.mdx`);
    await writeFile(sourcePath, SOURCE_MDX, "utf8");
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: join(dir, "missing.mdx"),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("does not exist"))).toBe(true);
  });

  it("fails when the output does not start with `---`", async () => {
    const bad = `Hello, this is prose before frontmatter.\n${TRANSLATED_MDX}`;
    const { sourcePath, outputPath } = await writeFixture(bad);
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('does not start with "---"'))
    ).toBe(true);
  });

  it("fails when imageAlt is missing", async () => {
    const bad = TRANSLATED_MDX.replace(IMAGE_ALT_LINE_RE, "");
    const { sourcePath, outputPath } = await writeFixture(bad);
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("imageAlt"))).toBe(true);
  });

  it("fails when imageAlt is the empty string", async () => {
    const bad = TRANSLATED_MDX.replace(
      "imageAlt: Boris Cherny 的插圖",
      'imageAlt: ""'
    );
    const { sourcePath, outputPath } = await writeFixture(bad);
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("imageAlt"))).toBe(true);
  });

  it("fails when `date` changes", async () => {
    const bad = TRANSLATED_MDX.replace("date: 2026-05-23", "date: 2027-01-01");
    const { sourcePath, outputPath } = await writeFixture(bad);
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("`date` changed"))).toBe(true);
  });

  it("fails when `tag` changes", async () => {
    const bad = TRANSLATED_MDX.replace("tag: Entity", "tag: Concept");
    const { sourcePath, outputPath } = await writeFixture(bad);
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("`tag` changed"))).toBe(true);
  });

  it("fails when `readingTime` changes", async () => {
    const bad = TRANSLATED_MDX.replace("readingTime: 5", "readingTime: 7");
    const { sourcePath, outputPath } = await writeFixture(bad);
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("`readingTime` changed"))).toBe(
      true
    );
  });

  it("fails when readingTime is re-emitted as a quoted string (violates the number contract)", async () => {
    // gray-matter parses `readingTime: 5` as the number 5; a quoted `"5"` is a
    // string, which the blog's z.number() contract rejects at build time — so
    // the validator must reject it too (via ArticleContractSchema), not pass.
    const quoted = TRANSLATED_MDX.replace("readingTime: 5", 'readingTime: "5"');
    const { sourcePath, outputPath } = await writeFixture(quoted);
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("ArticleContractSchema"))).toBe(
      true
    );
  });

  it("fails when the heroImage line is altered", async () => {
    const bad = TRANSLATED_MDX.replace(
      `export { default as heroImage } from "../assets/${SLUG}.png";`,
      `export { default as heroImage } from "../assets/${SLUG}-zh.png";`
    );
    const { sourcePath, outputPath } = await writeFixture(bad);
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes("heroImage line mismatch"))
    ).toBe(true);
  });

  it("fails when output filename slug differs from source filename slug", async () => {
    const dir = await mkdtemp(join(tmpdir(), "translate-validate-"));
    const sourcePath = join(dir, `${SLUG}.mdx`);
    const outputPath = join(dir, "different-slug.mdx");
    await writeFile(sourcePath, SOURCE_MDX, "utf8");
    await writeFile(outputPath, TRANSLATED_MDX, "utf8");
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes("does not match source slug"))
    ).toBe(true);
  });

  it("collects multiple failures into the errors list", async () => {
    const bad = TRANSLATED_MDX.replace("date: 2026-05-23", "date: 2030-12-31")
      .replace("tag: Entity", "tag: Concept")
      .replace("readingTime: 5", "readingTime: 99");
    const { sourcePath, outputPath } = await writeFixture(bad);
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
