import { describe, expect, it } from "bun:test";

import { toPlainText } from "../import-wiki/plain-text.ts";

describe("toPlainText", () => {
  it("reduces wikilinks to their display text", () => {
    expect(
      toPlainText("See [[claude-code]] and [[anthropic|Anthropic]].")
    ).toBe("See Claude Code and Anthropic.");
  });

  it("drops fenced code blocks entirely", () => {
    const md = [
      "Intro line.",
      "```ts",
      "const secret = 42;",
      "```",
      "Outro line.",
    ].join("\n");
    expect(toPlainText(md)).toBe("Intro line. Outro line.");
  });

  it("strips heading, blockquote, and list markers", () => {
    const md = ["# Title", "> a quote", "- item one", "1. item two"].join("\n");
    expect(toPlainText(md)).toBe("Title a quote item one item two");
  });

  it("keeps link and image text but drops the URLs", () => {
    expect(toPlainText("A [link](https://x.com) and ![alt](/y.png).")).toBe(
      "A link and alt."
    );
  });

  it("removes emphasis and inline-code markers, keeping the content", () => {
    expect(toPlainText("**bold** and `code` and *em*.")).toBe(
      "bold and code and em."
    );
  });

  it("drops table delimiter rows and flattens cell pipes", () => {
    const md = ["| A | B |", "| --- | --- |", "| one | two |"].join("\n");
    expect(toPlainText(md)).toBe("A B one two");
  });

  it("collapses whitespace and returns empty string for empty input", () => {
    expect(toPlainText("")).toBe("");
    expect(toPlainText("\n\n   \n")).toBe("");
  });
});
