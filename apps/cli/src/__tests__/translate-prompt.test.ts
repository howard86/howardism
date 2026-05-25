import { describe, expect, it } from "bun:test";

import { buildTranslatePrompt } from "../translate/prompt.ts";

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
