import { describe, expect, it } from "bun:test";

import { HEADING_MAP, normalizeHeadings } from "../translate/headings.ts";

describe("normalizeHeadings — known headings → canonical zh-TW", () => {
  it("maps each English structural heading to its canonical form (case-insensitive)", () => {
    for (const [english, canonical] of Object.entries(HEADING_MAP)) {
      // Title-case
      const title = english.replace(/\b\w/g, (c) => c.toUpperCase());
      expect(normalizeHeadings(`## ${title}`)).toBe(`## ${canonical}`);
      // lowercase
      expect(normalizeHeadings(`## ${english}`)).toBe(`## ${canonical}`);
      // UPPERCASE
      expect(normalizeHeadings(`## ${english.toUpperCase()}`)).toBe(
        `## ${canonical}`
      );
    }
  });

  it("preserves the original level: H2 stays H2, H3 stays H3", () => {
    expect(normalizeHeadings("## Open Questions")).toBe("## 待解決的問題");
    expect(normalizeHeadings("### Open Questions")).toBe("### 待解決的問題");
    expect(normalizeHeadings("## sources")).toBe("## 資料來源");
    expect(normalizeHeadings("### SOURCES")).toBe("### 資料來源");
  });

  it("trims trailing whitespace on the heading text but preserves level", () => {
    expect(normalizeHeadings("## Sources   ")).toBe("## 資料來源");
  });
});

describe("normalizeHeadings — non-mapped or non-heading content stays byte-identical", () => {
  it("leaves a content heading not in the map untouched", () => {
    const input = "## Key quotes";
    expect(normalizeHeadings(input)).toBe(input);
    const input2 = '## The "tracer bullet" image';
    expect(normalizeHeadings(input2)).toBe(input2);
  });

  it("does NOT substring-match: 'Summary of findings' is left alone", () => {
    const input = "## Summary of findings";
    expect(normalizeHeadings(input)).toBe(input);
  });

  it("does not touch H1, H4, H5, H6 — only H2 and H3", () => {
    expect(normalizeHeadings("# Sources")).toBe("# Sources");
    expect(normalizeHeadings("#### Sources")).toBe("#### Sources");
    expect(normalizeHeadings("##### Sources")).toBe("##### Sources");
  });

  it("body prose containing a map word is untouched", () => {
    const input = [
      "The summary of this section is below.",
      "We will revisit sources and details later.",
      "Open questions remain about derived behaviour.",
    ].join("\n");
    expect(normalizeHeadings(input)).toBe(input);
  });
});

describe("normalizeHeadings — fenced code blocks are skipped", () => {
  it("does NOT change a heading-looking line inside a ``` fence", () => {
    const input = [
      "## Sources",
      "",
      "```md",
      "## Sources",
      "## Open Questions",
      "```",
      "",
      "## Connections",
    ].join("\n");
    const expected = [
      "## 資料來源",
      "",
      "```md",
      "## Sources",
      "## Open Questions",
      "```",
      "",
      "## 相關連結",
    ].join("\n");
    expect(normalizeHeadings(input)).toBe(expected);
  });

  it("handles multiple fences correctly", () => {
    const input = [
      "## Summary",
      "```",
      "## Sources",
      "```",
      "## Sources",
      "```ts",
      "## Open Questions",
      "```",
      "## Open Questions",
    ].join("\n");
    const expected = [
      "## 摘要",
      "```",
      "## Sources",
      "```",
      "## 資料來源",
      "```ts",
      "## Open Questions",
      "```",
      "## 待解決的問題",
    ].join("\n");
    expect(normalizeHeadings(input)).toBe(expected);
  });
});

describe("normalizeHeadings — zh-TW variants collapse to one canonical", () => {
  it("rewrites the looser zh-TW forms an engine emits to the canonical form", () => {
    // These are the forms the engines actually produced in the corpus.
    expect(normalizeHeadings("## 來源")).toBe("## 資料來源");
    expect(normalizeHeadings("## 關聯")).toBe("## 相關連結");
    expect(normalizeHeadings("## 待解問題")).toBe("## 待解決的問題");
    expect(normalizeHeadings("### 總結")).toBe("### 摘要");
  });

  it("leaves the canonical zh-TW form unchanged (idempotent key)", () => {
    expect(normalizeHeadings("## 資料來源")).toBe("## 資料來源");
    expect(normalizeHeadings("## 相關連結")).toBe("## 相關連結");
  });
});

describe("normalizeHeadings — line endings and tilde fences", () => {
  it("preserves a trailing \\r so CRLF files keep uniform line endings", () => {
    expect(normalizeHeadings("## Sources\r\nbody\r\n")).toBe(
      "## 資料來源\r\nbody\r\n"
    );
    // The non-heading line's \r is untouched; the rewritten line keeps its own.
    expect(normalizeHeadings("## 來源\r\n## Connections\r\n")).toBe(
      "## 資料來源\r\n## 相關連結\r\n"
    );
  });

  it("skips headings inside a ~~~ fenced block", () => {
    const input = ["~~~", "## 來源", "~~~", "## 來源"].join("\n");
    const expected = ["~~~", "## 來源", "~~~", "## 資料來源"].join("\n");
    expect(normalizeHeadings(input)).toBe(expected);
  });

  it("does not let a ``` line close a ~~~ block", () => {
    const input = ["~~~", "```", "## Sources", "~~~", "## Sources"].join("\n");
    const expected = ["~~~", "```", "## Sources", "~~~", "## 資料來源"].join(
      "\n"
    );
    expect(normalizeHeadings(input)).toBe(expected);
  });
});

describe("normalizeHeadings — idempotent and pure", () => {
  it("running twice returns the same result as running once", () => {
    const input = [
      "---",
      "title: foo",
      "---",
      "",
      "## Sources",
      "Body line.",
      "### Open Questions",
      "More body.",
      "## Key quotes",
      "```",
      "## Sources",
      "```",
    ].join("\n");
    const once = normalizeHeadings(input);
    const twice = normalizeHeadings(once);
    expect(twice).toBe(once);
  });

  it("returns the input unchanged when there are no mapped headings", () => {
    const input = "# Title\n\nBody only, no structural sections.\n";
    expect(normalizeHeadings(input)).toBe(input);
  });
});
