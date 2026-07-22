import { describe, expect, it } from "bun:test";

import {
  buildStructuredTranslatePrompt,
  buildTranslatePrompt,
  TRANSLATION_OUTPUT_SCHEMA,
} from "../translate/prompt.ts";

const SOURCE = "/abs/repo/apps/blog/src/content/articles/foo.mdx";
const OUTPUT = "/abs/repo/apps/blog/src/content/articles-zh-TW/foo.mdx";
const GLOSSARY_CMD = "bun /abs/repo/apps/cli/src/translate/glossary.ts";

describe("buildTranslatePrompt", () => {
  const prompt = buildTranslatePrompt({
    sourceAbsPath: SOURCE,
    outputAbsPath: OUTPUT,
    targetLang: "zh-TW",
    glossaryCmd: GLOSSARY_CMD,
  });

  it("includes the source and output absolute paths", () => {
    expect(prompt).toContain(SOURCE);
    expect(prompt).toContain(OUTPUT);
  });

  it("names the target language", () => {
    expect(prompt).toContain("zh-TW");
    // Reinforce we mean traditional Chinese, not simplified.
    expect(prompt.toLowerCase()).toContain("traditional");
  });

  it("requires the output to start with `---`", () => {
    expect(prompt).toContain("---");
    expect(prompt.toLowerCase()).toContain("first line");
  });

  it("declares the heroImage line as byte-identical", () => {
    expect(prompt).toContain("heroImage");
    expect(prompt.toLowerCase()).toContain("byte-identical");
    expect(prompt).toContain('"../assets/<slug>.png"');
  });

  it("calls out the preserved frontmatter keys", () => {
    expect(prompt).toContain("`date`");
    expect(prompt).toContain("`tag`");
    expect(prompt).toContain("`topic`");
    expect(prompt).toContain("`readingTime`");
  });

  it("requires URLs and sources[].title to stay unchanged", () => {
    expect(prompt.toLowerCase()).toContain("url");
    expect(prompt).toContain("sources[].title");
  });

  it("forbids translating fenced and inline code", () => {
    expect(prompt.toLowerCase()).toContain("fenced code");
    expect(prompt.toLowerCase()).toContain("inline code");
  });

  it("declares which fields ARE translated", () => {
    expect(prompt).toContain("title");
    expect(prompt).toContain("description");
    expect(prompt).toContain("imageAlt");
    expect(prompt.toLowerCase()).toContain("body prose");
  });

  it("includes the glossary list and add subcommands", () => {
    expect(prompt).toContain(`${GLOSSARY_CMD} list`);
    expect(prompt).toContain(`${GLOSSARY_CMD} add`);
    expect(prompt).toContain('"<term>" <category>');
  });

  it("lists allowed glossary categories", () => {
    expect(prompt).toContain("person");
    expect(prompt).toContain("org");
    expect(prompt).toContain("product");
    expect(prompt).toContain("tech");
    expect(prompt).toContain("entity");
  });
});

const SOURCE_MDX = `---
date: 2026-05-01
title: A Test Article
readingTime: 3
---

export { default as heroImage } from "../assets/foo.png";

Body prose mentioning Boris Cherny.

- first bullet
- second bullet
`;

describe("buildStructuredTranslatePrompt", () => {
  const structured = buildStructuredTranslatePrompt({
    glossaryTerms: ["Boris Cherny", "Anthropic"],
    sourceText: SOURCE_MDX,
    targetLang: "zh-TW",
  });

  it("inlines the whole source MDX instead of a file path", () => {
    expect(structured).toContain(SOURCE_MDX);
    expect(structured).not.toContain(SOURCE);
    expect(structured).not.toContain(OUTPUT);
  });

  it("inlines the glossary terms and never shells out to the glossary CLI", () => {
    expect(structured).toContain("Boris Cherny");
    expect(structured).toContain("Anthropic");
    expect(structured).not.toContain("add-many");
    expect(structured).not.toContain(`${GLOSSARY_CMD} list`);
  });

  it("forbids tool use so the whole translation happens in one turn", () => {
    expect(structured).toContain("ONE turn");
    expect(structured.toLowerCase()).toContain("do not read files");
    expect(structured.toLowerCase()).toContain("do not write files");
  });

  it("names the target language and traditional script", () => {
    expect(structured).toContain("zh-TW");
    expect(structured.toLowerCase()).toContain("traditional");
  });

  it("carries over every byte-identical invariant the validator enforces", () => {
    expect(structured.toLowerCase()).toContain("byte-identical");
    expect(structured).toContain("heroImage");
    expect(structured).toContain("`date`");
    expect(structured).toContain("`tag`");
    expect(structured).toContain("`topic`");
    expect(structured).toContain("`readingTime`");
    expect(structured.toLowerCase()).toContain("url");
    expect(structured).toContain("sources[].title");
    expect(structured.toLowerCase()).toContain("fenced code");
    expect(structured.toLowerCase()).toContain("inline code");
    expect(structured).toContain("$$...$$");
    expect(structured).toContain("&lt;");
  });

  it("declares which fields ARE translated", () => {
    expect(structured).toContain("title");
    expect(structured).toContain("description");
    expect(structured).toContain("imageAlt");
    expect(structured.toLowerCase()).toContain("body prose");
  });

  it("demands every source list item survive (the corpus's top defect)", () => {
    expect(structured).toContain("EVERY markdown list item");
    expect(structured).toContain("same count");
  });

  it("asks for the JSON object only, with both schema keys", () => {
    expect(structured).toContain('"mdx"');
    expect(structured).toContain('"newTerms"');
    expect(structured).toContain("person | org | product | tech | entity");
  });
});

describe("TRANSLATION_OUTPUT_SCHEMA", () => {
  it("is a closed object requiring both keys", () => {
    expect(TRANSLATION_OUTPUT_SCHEMA.type).toBe("object");
    expect(TRANSLATION_OUTPUT_SCHEMA.additionalProperties).toBe(false);
    expect(TRANSLATION_OUTPUT_SCHEMA.required).toEqual(["mdx", "newTerms"]);
    expect(TRANSLATION_OUTPUT_SCHEMA.properties.mdx.type).toBe("string");
  });

  it("constrains newTerms entries to the real glossary categories", () => {
    const item = TRANSLATION_OUTPUT_SCHEMA.properties.newTerms.items;
    expect(item.additionalProperties).toBe(false);
    expect(item.required).toEqual(["term", "category"]);
    expect(item.properties.category.enum).toEqual([
      "person",
      "org",
      "product",
      "tech",
      "entity",
    ]);
  });

  it("serialises to JSON (it is written to a file for `codex --output-schema`)", () => {
    expect(() => JSON.stringify(TRANSLATION_OUTPUT_SCHEMA)).not.toThrow();
  });
});
