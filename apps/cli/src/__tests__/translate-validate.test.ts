import { describe, expect, it } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  countListItems,
  extractDisplayMath,
  extractFencedCodeBlocks,
  extractInlineCodeSpans,
  extractInlineMath,
  extractLinkUrls,
  extractSourceTitles,
  lengthRatio,
  listItemRatio,
  MIN_LIST_ITEM_RATIO,
  residualEnglishRatio,
  validateTranslation,
} from "../translate/validate.ts";

const SLUG = "boris-cherny";

const IMAGE_ALT_LINE_RE = /imageAlt: Boris Cherny 的插圖\n/;
const SECOND_SOURCE_ENTRY_RE =
  / {2}- title: Example Source Two\n {4}url: https:\/\/example\.com\/two\n/;

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

// A richer fixture that exercises links, code fences, inline code, math, and
// multiple `sources[]` entries — everything the plain Boris Cherny fixture
// above doesn't touch.
const RICH_SLUG = "rich-article";

const SOURCE_RICH_MDX = `---
date: 2026-05-23
title: Rich Article
description: A fixture exercising every byte-identical invariant
tag: Concept
domain: agent-systems
tags:
  - agent-engineering
readingTime: 6
imageAlt: Illustration for Rich Article
sources:
  - title: Example Source One
    url: https://example.com/one
  - title: Example Source Two
    url: https://example.com/two
---
export { default as heroImage } from "../assets/${RICH_SLUG}.png";

## Summary

See [Example Source One](https://example.com/one) and [Boris Cherny](/articles/boris-cherny), or visit https://example.com/bare directly.

Run \`bun test\` to check. The engine cost <$100 total, and next quarter's budget is $200–$500 depending on scale.

$$\\text{score}=q+c\\frac{\\sqrt{\\sum V_i}}{v+1}$$

Balance $P=7$ against the budget.

\`\`\`bash
echo "hello"
\`\`\`

## Sources

- [Example Source One](https://example.com/one)
- [Example Source Two](https://example.com/two)
`;

const TRANSLATED_RICH_MDX = `---
date: 2026-05-23
title: 豐富文章
description: 展示每一項逐字不變規則的範例
tag: Concept
domain: agent-systems
tags:
  - agent-engineering
readingTime: 6
imageAlt: 豐富文章插圖
sources:
  - title: Example Source One
    url: https://example.com/one
  - title: Example Source Two
    url: https://example.com/two
---
export { default as heroImage } from "../assets/${RICH_SLUG}.png";

## 摘要

參見 [Example Source One](https://example.com/one) 和 [Boris Cherny](/articles/boris-cherny)，或直接造訪 https://example.com/bare。

執行 \`bun test\` 進行檢查。引擎成本低於 <$100，下一季預算為 $200–$500，視規模而定。

$$\\text{score}=q+c\\frac{\\sqrt{\\sum V_i}}{v+1}$$

將 $P=7$ 與預算取得平衡。

\`\`\`bash
echo "hello"
\`\`\`

## 資料來源

- [Example Source One](https://example.com/one)
- [Example Source Two](https://example.com/two)
`;

const writeRichFixture = async (
  sourceBody: string,
  outputBody: string
): Promise<Fixture> => {
  const dir = await mkdtemp(join(tmpdir(), "translate-validate-rich-"));
  const sourcePath = join(dir, `${RICH_SLUG}.mdx`);
  const outputPath = join(dir, "out", `${RICH_SLUG}.mdx`);
  await writeFile(sourcePath, sourceBody, "utf8");
  await Bun.write(outputPath, outputBody);
  return { sourcePath, outputPath };
};

describe("validateTranslation — byte-identical invariants", () => {
  it("passes a clean rich translation (links, code, math, sources)", async () => {
    const { sourcePath, outputPath } = await writeRichFixture(
      SOURCE_RICH_MDX,
      TRANSLATED_RICH_MDX
    );
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("fails when a link URL is dropped", async () => {
    const bad = TRANSLATED_RICH_MDX.replace(
      "和 [Boris Cherny](/articles/boris-cherny)，",
      "，"
    );
    const { sourcePath, outputPath } = await writeRichFixture(
      SOURCE_RICH_MDX,
      bad
    );
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.startsWith("Link URLs changed"))).toBe(
      true
    );
  });

  it("fails when a link URL is altered", async () => {
    const bad = TRANSLATED_RICH_MDX.replace(
      "https://example.com/bare",
      "https://example.com/altered"
    );
    const { sourcePath, outputPath } = await writeRichFixture(
      SOURCE_RICH_MDX,
      bad
    );
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.startsWith("Link URLs changed"))).toBe(
      true
    );
  });

  it("fails when a fenced code block body is changed", async () => {
    const bad = TRANSLATED_RICH_MDX.replace('echo "hello"', 'echo "你好"');
    const { sourcePath, outputPath } = await writeRichFixture(
      SOURCE_RICH_MDX,
      bad
    );
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.startsWith("Fenced code block"))).toBe(
      true
    );
  });

  it("fails when an inline code span is dropped", async () => {
    const bad = TRANSLATED_RICH_MDX.replace("`bun test`", "bun test");
    const { sourcePath, outputPath } = await writeRichFixture(
      SOURCE_RICH_MDX,
      bad
    );
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.startsWith("Inline code spans changed"))
    ).toBe(true);
  });

  it("fails when a display math span is altered", async () => {
    const bad = TRANSLATED_RICH_MDX.replace(
      "\\text{score}=q+c\\frac{\\sqrt{\\sum V_i}}{v+1}",
      "\\text{score}=q+c\\frac{\\sqrt{\\sum V_i}}{v+2}"
    );
    const { sourcePath, outputPath } = await writeRichFixture(
      SOURCE_RICH_MDX,
      bad
    );
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.startsWith("Display math"))).toBe(true);
  });

  it("fails when an inline math span is altered", async () => {
    const bad = TRANSLATED_RICH_MDX.replace("$P=7$", "$P=8$");
    const { sourcePath, outputPath } = await writeRichFixture(
      SOURCE_RICH_MDX,
      bad
    );
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.startsWith("Inline math"))).toBe(true);
  });

  it("does NOT treat prose dollar amounts ($200–$500, <$100) as math", async () => {
    // Both source and output keep the bare dollar amounts untouched — this
    // must pass cleanly, proving the $-in-prose false positive is avoided.
    const { sourcePath, outputPath } = await writeRichFixture(
      SOURCE_RICH_MDX,
      TRANSLATED_RICH_MDX
    );
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(
      result.errors.some(
        (e) => e.includes("Display math") || e.includes("Inline math")
      )
    ).toBe(false);
  });

  it("fails when a sources[].title is translated", async () => {
    const bad = TRANSLATED_RICH_MDX.replace(
      "title: Example Source Two",
      "title: 範例來源二"
    );
    const { sourcePath, outputPath } = await writeRichFixture(
      SOURCE_RICH_MDX,
      bad
    );
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("sources[1].title"))).toBe(
      true
    );
  });

  it("fails when a sources[] entry is dropped", async () => {
    const bad = TRANSLATED_RICH_MDX.replace(SECOND_SOURCE_ENTRY_RE, "");
    const { sourcePath, outputPath } = await writeRichFixture(
      SOURCE_RICH_MDX,
      bad
    );
    const result = await validateTranslation({
      sourceAbsPath: sourcePath,
      outputAbsPath: outputPath,
    });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes("`sources` length changed"))
    ).toBe(true);
  });
});

describe("extractLinkUrls", () => {
  it("extracts markdown link targets and bare URLs", () => {
    const text =
      "See [Boris Cherny](/articles/boris-cherny) or https://example.com/bare directly.";
    expect(extractLinkUrls(text)).toEqual([
      "/articles/boris-cherny",
      "https://example.com/bare",
    ]);
  });

  it("does not truncate a URL containing a nested balanced paren", () => {
    const url = "https://cdn.prod.website-files.com/x/y_v3%20(1).pdf";
    const text = `[Playbook](${url})`;
    expect(extractLinkUrls(text)).toEqual([url, url]);
  });
});

describe("extractInlineMath / extractDisplayMath", () => {
  it("extracts real inline math spans", () => {
    expect(extractInlineMath("Balance $P=7$ against the budget.")).toEqual([
      "$P=7$",
    ]);
  });

  it("does not treat prose dollar amounts as math ($200–$500, <$100)", () => {
    expect(
      extractInlineMath(
        "The engine cost <$100 total, and next quarter's budget is $200–$500 depending on scale."
      )
    ).toEqual([]);
  });

  it("does not treat a financial table row as math", () => {
    const table = "| $1–5M | $233K | $316K | +36% | +29% | +27% |";
    expect(extractInlineMath(table)).toEqual([]);
  });

  it("extracts display math and excludes it from inline math", () => {
    const text = "$$\\text{score}=q+c$$ then $P=7$";
    expect(extractDisplayMath(text)).toEqual(["$$\\text{score}=q+c$$"]);
    expect(extractInlineMath(text)).toEqual(["$P=7$"]);
  });
});

describe("extractFencedCodeBlocks / extractInlineCodeSpans", () => {
  it("extracts fenced code block bodies", () => {
    const text = '```bash\necho "hello"\n```';
    expect(extractFencedCodeBlocks(text)).toEqual(['echo "hello"\n']);
  });

  it("extracts inline code spans, skipping fenced blocks", () => {
    const text = "Run `bun test`.\n```bash\n`not inline`\n```";
    expect(extractInlineCodeSpans(text)).toEqual(["`bun test`"]);
  });
});

describe("extractSourceTitles", () => {
  it("extracts titles in order", () => {
    expect(
      extractSourceTitles({
        sources: [{ title: "One", url: "https://a" }, { title: "Two" }],
      })
    ).toEqual(["One", "Two"]);
  });

  it("returns an empty array when sources is missing", () => {
    expect(extractSourceTitles({})).toEqual([]);
  });
});

describe("residualEnglishRatio", () => {
  it("scores a clean zh-TW translation low, well under an untranslated one", () => {
    const translated =
      "**迴圈**是一個 agent 程序，它會重複執行提示詞，直到佇列為空或達到停止條件。截至 2026 年年中，三種收斂的實作方式都指出迴圈正在成為與 single-shot session 平起平坐的基本要素。";
    const untranslated =
      "A **loop** is an agent process that repeatedly executes a prompt until a queue is empty or a stopping condition is reached.";
    const translatedRatio = residualEnglishRatio(translated);
    const untranslatedRatio = residualEnglishRatio(untranslated);
    expect(translatedRatio).toBeLessThan(0.5);
    expect(untranslatedRatio).toBeGreaterThan(0.8);
    expect(translatedRatio).toBeLessThan(untranslatedRatio);
  });

  it("strips code, math, links, and the hero line before scoring", () => {
    const body = `export { default as heroImage } from "../assets/x.png";

## 摘要

參見 [連結文字](https://example.com/some-english-looking-path) 與 \`inlineCodeSpan\` 及 $englishInsideMath$。

這是繁體中文內容。`;
    expect(residualEnglishRatio(body)).toBeLessThan(0.3);
  });
});

describe("lengthRatio", () => {
  it("returns close to 1 for equal-length bodies", () => {
    expect(lengthRatio("abcdefghij", "1234567890")).toBe(1);
  });

  it("returns a low ratio for a truncated/summarised output", () => {
    const source = "x".repeat(1000);
    const output = "y".repeat(100);
    expect(lengthRatio(source, output)).toBeLessThan(0.2);
  });

  it("handles an empty source body without dividing by zero", () => {
    expect(lengthRatio("", "")).toBe(1);
    expect(lengthRatio("", "non-empty")).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("listItemRatio", () => {
  const list = (n: number): string =>
    Array.from({ length: n }, (_, i) => `- item ${i}`).join("\n");

  it("counts bullets across -, * and + markers, including indented ones", () => {
    expect(countListItems("- a\n* b\n+ c\n  - nested\ntext")).toBe(4);
  });

  it("does not count a hyphen inside prose or a frontmatter fence", () => {
    expect(countListItems("---\nwell-known co-op state-of-the-art\n")).toBe(0);
  });

  it("returns 1 when the source has no list at all", () => {
    expect(listItemRatio("plain prose", "純文字")).toBe(1);
  });

  it("returns 1 when every bullet survives translation", () => {
    expect(listItemRatio(list(12), list(12))).toBe(1);
  });

  it("catches the dropped-bullet defect the length ratio misses", () => {
    // The real corpus failure: a long trailing list is truncated while the
    // surrounding prose is fully translated, so total length barely moves.
    const prose = "詳細的中文段落內容。".repeat(400);
    const source = `${prose}\n\n${list(40)}`;
    const output = `${prose}\n\n${list(15)}`;
    expect(listItemRatio(source, output)).toBeCloseTo(0.375, 3);
    expect(listItemRatio(source, output)).toBeLessThan(MIN_LIST_ITEM_RATIO);
    // The reason a dedicated check is needed: length looks perfectly healthy.
    expect(lengthRatio(source, output)).toBeGreaterThan(0.9);
  });

  it("tolerates a couple of reflowed bullets at the threshold", () => {
    expect(listItemRatio(list(40), list(38))).toBeGreaterThanOrEqual(
      MIN_LIST_ITEM_RATIO
    );
  });
});
