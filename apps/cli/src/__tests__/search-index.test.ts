import { describe, expect, it } from "bun:test";

import { buildSearchEntry } from "../search-index.ts";

const HERO = 'export { default as heroImage } from "../assets/x.png";';

function mdx(frontmatter: string, body: string): string {
  return ["---", frontmatter, "---", HERO, "", body, ""].join("\n");
}

describe("buildSearchEntry", () => {
  it("extracts frontmatter fields and plain-text body", () => {
    const raw = mdx(
      [
        "date: 2026-05-06",
        "title: Agent Loop Pattern",
        "description: Loops as a primitive",
        "tag: Concept",
        "domain: ai-engineering",
        "tags:",
        "  - automation",
        "  - harness",
      ].join("\n"),
      "## Summary\n\nA **loop** runs [[claude-code]] until done."
    );

    const entry = buildSearchEntry(raw, "agent-loop-pattern");

    expect(entry).not.toBeNull();
    expect(entry).toMatchObject({
      slug: "agent-loop-pattern",
      title: "Agent Loop Pattern",
      description: "Loops as a primitive",
      tag: "Concept",
      domain: "ai-engineering",
      tags: ["automation", "harness"],
    });
    // Body is plain text: heading markup, the hero export, emphasis, and the
    // wikilink syntax are all gone; the wikilink's display text remains.
    expect(entry?.body).toBe("Summary A loop runs Claude Code until done.");
    expect(entry?.body).not.toContain("heroImage");
  });

  it("omits optional domain and tags when absent", () => {
    const raw = mdx(
      ["title: Bare", "description: d", "tag: Essay"].join("\n"),
      "Body text."
    );
    const entry = buildSearchEntry(raw, "bare");
    expect(entry).toMatchObject({
      slug: "bare",
      tag: "Essay",
      body: "Body text.",
    });
    expect(entry?.domain).toBeUndefined();
    expect(entry?.tags).toBeUndefined();
  });

  it("returns null for archived articles so they stay out of search", () => {
    const raw = mdx(
      [
        "title: Hidden",
        "description: d",
        "tag: Concept",
        "archived: true",
      ].join("\n"),
      "Body."
    );
    expect(buildSearchEntry(raw, "hidden")).toBeNull();
  });
});
