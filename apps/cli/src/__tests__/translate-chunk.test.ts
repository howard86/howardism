import { describe, expect, it } from "bun:test";

import {
  CHUNK_TARGET_BYTES,
  chunkArticle,
  reassembleChunks,
} from "../translate/chunk.ts";
import { STRUCTURED_MAX_SOURCE_BYTES } from "../translate/index.ts";

const FRONTMATTER = `---
date: 2026-09-01
title: Chunk Fixture
description: A fixture for the splitter
tag: Concept
domain: agent-systems
readingTime: 9
imageAlt: Illustration for Chunk Fixture
---
`;
const HERO = 'export { default as heroImage } from "../assets/chunk.webp";\n';

const paragraph = (label: string, words = 12): string =>
  `${label} ${"lorem ipsum dolor ".repeat(words).trim()}.\n`;

const section = (title: string, paragraphs: number, words = 12): string =>
  `## ${title}\n\n${Array.from({ length: paragraphs }, (_, i) =>
    paragraph(`${title} p${i + 1}`, words)
  ).join("\n")}\n`;

const article = (...sections: string[]): string =>
  `${FRONTMATTER}${HERO}\n${paragraph("Intro")}\n${sections.join("")}`;

const bytes = (text: string): number => Buffer.byteLength(text, "utf8");

describe("chunkArticle", () => {
  it("leaves headroom under the structured ceiling", () => {
    expect(CHUNK_TARGET_BYTES).toBeLessThan(STRUCTURED_MAX_SOURCE_BYTES);
  });

  it("returns the whole article as one part when it fits", () => {
    const source = article(section("One", 2), section("Two", 2));
    expect(chunkArticle(source)).toEqual([source]);
  });

  it("splits at `## ` headings and concatenates back to the source", () => {
    const source = article(
      section("Alpha", 3),
      section("Beta", 3),
      section("Gamma", 3)
    );
    const chunks = chunkArticle(source, bytes(section("Alpha", 3)) + 20);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("")).toBe(source);
    for (const chunk of chunks.slice(1)) {
      expect(chunk.startsWith("## ")).toBe(true);
    }
  });

  it("keeps the frontmatter and heroImage line in the first part only", () => {
    const source = article(section("Alpha", 3), section("Beta", 3));
    const chunks = chunkArticle(source, bytes(section("Alpha", 3)) + 20);
    expect(chunks[0].startsWith(FRONTMATTER + HERO)).toBe(true);
    for (const chunk of chunks.slice(1)) {
      expect(chunk).not.toContain("---\n");
      expect(chunk).not.toContain("heroImage");
    }
  });

  it("never splits at a `## ` line inside a fenced code block", () => {
    const fenced = [
      "## Code",
      "",
      "```md",
      "## not a heading",
      "",
      "still code",
      "```",
      "",
      "",
    ].join("\n");
    const source = article(section("Alpha", 2), fenced, section("Beta", 2));
    const chunks = chunkArticle(source, 10);
    expect(chunks.join("")).toBe(source);
    const withFence = chunks.filter((c) => c.includes("```md"));
    expect(withFence).toHaveLength(1);
    expect(withFence[0]).toContain("## not a heading\n\nstill code\n```");
    expect(chunks.some((c) => c.startsWith("## not a heading"))).toBe(false);
  });

  it("splits an oversize section at blank-line paragraph boundaries", () => {
    const big = section("Big", 6, 20);
    const source = article(big);
    const target = bytes(big) / 3;
    const chunks = chunkArticle(source, target);
    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks.join("")).toBe(source);
    for (const chunk of chunks.slice(1)) {
      // Every later part starts at a paragraph's first line.
      expect(chunk.startsWith("Big p")).toBe(true);
    }
  });

  it("keeps a table whole even when its section is oversize", () => {
    const rows = Array.from(
      { length: 20 },
      (_, i) => `| row ${i} | ${"cell ".repeat(8)}|`
    );
    const table = ["| a | b |", "| --- | --- |", ...rows].join("\n");
    const tableSection = `## Table\n\n${paragraph("Before")}\n${table}\n\n${paragraph("After")}\n`;
    const source = article(tableSection);
    const chunks = chunkArticle(source, 100);
    expect(chunks.join("")).toBe(source);
    const withTable = chunks.filter((c) => c.includes("| row "));
    expect(withTable).toHaveLength(1);
    expect(withTable[0]).toContain(table);
  });

  it("never splits inside a multi-line JSX element or a $$ math block", () => {
    const jsx = `<Callout type="note">\n\n${paragraph("Inside one")}\n${paragraph("Inside two")}\n</Callout>\n`;
    const math = "$$\na + b\n\n= c\n$$\n";
    const source = article(
      `## Mixed\n\n${paragraph("Lead")}\n${jsx}\n${math}\n${paragraph("Tail")}`
    );
    const chunks = chunkArticle(source, 50);
    expect(chunks.join("")).toBe(source);
    expect(chunks.find((c) => c.includes("<Callout"))).toContain("</Callout>");
    expect(chunks.find((c) => c.includes("a + b"))).toContain("= c\n$$");
  });

  it("keeps a single paragraph above the target whole", () => {
    const huge = paragraph("Huge", 200);
    const source = article(`## Solo\n\n${huge}`);
    const chunks = chunkArticle(source, 100);
    expect(chunks.join("")).toBe(source);
    expect(chunks.some((c) => c.includes(huge))).toBe(true);
  });
});

describe("reassembleChunks", () => {
  const source = article(
    section("Alpha", 4),
    section("Beta", 4),
    section("Gamma", 4)
  );
  const chunks = chunkArticle(source, 300);

  it("is byte-identical when parts pass through unchanged", () => {
    expect(chunks.length).toBeGreaterThan(2);
    expect(reassembleChunks(chunks, chunks)).toBe(source);
  });

  it("uses the source's seam whitespace, not the model's", () => {
    const noisy = chunks.map((c) => `\n\n${c.trimEnd()}   \n\n\n`);
    expect(reassembleChunks(chunks, noisy)).toBe(source);
  });

  it("rejects a part-count mismatch", () => {
    expect(() => reassembleChunks(chunks, chunks.slice(1))).toThrow(
      "translated parts"
    );
  });
});
