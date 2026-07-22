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
        "domain: agent-systems",
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
      domain: "agent-systems",
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

  it("caps a long body to its lead text without splitting a word", () => {
    // A body well over the 1200-char cap: 400 four-char words = ~2000 chars.
    const longBody = Array.from({ length: 400 }, () => "alfa").join(" ");
    const raw = mdx(
      ["title: Long", "description: d", "tag: Essay"].join("\n"),
      longBody
    );
    const entry = buildSearchEntry(raw, "long");
    expect(entry?.body.length).toBeLessThanOrEqual(1200);
    // Trimmed at a word boundary: the lead is preserved and no token is cut.
    expect(longBody.startsWith(entry?.body ?? "")).toBe(true);
    expect(entry?.body.endsWith("alfa")).toBe(true);
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
