import { describe, expect, it } from "bun:test";

import { parseArticleGraph } from "@howardism/article-contract/manifests/graph";

import {
  buildSearchEntry,
  deriveKeywords,
  type PartialSearchEntry,
} from "../search-index.ts";

const HERO = 'export { default as heroImage } from "../assets/x.png";';

function mdx(frontmatter: string, body: string): string {
  return ["---", frontmatter, "---", HERO, "", body, ""].join("\n");
}

describe("buildSearchEntry", () => {
  it("extracts frontmatter fields and no article text", () => {
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

    expect(entry).toEqual({
      slug: "agent-loop-pattern",
      title: "Agent Loop Pattern",
      description: "Loops as a primitive",
      tag: "Concept",
      domain: "agent-systems",
      tags: ["automation", "harness"],
    });
  });

  it("omits optional domain and tags when absent", () => {
    const raw = mdx(
      ["title: Bare", "description: d", "tag: Essay"].join("\n"),
      "Body text."
    );
    const entry = buildSearchEntry(raw, "bare");
    expect(entry).toMatchObject({ slug: "bare", tag: "Essay" });
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

describe("deriveKeywords", () => {
  const subject: PartialSearchEntry = {
    slug: "agent-loop-pattern",
    title: "Agent Loop Pattern",
    description: "d",
    tag: "Concept",
    tags: ["automation"],
  };

  const tagsBySlug = new Map([
    ["agent-loop-pattern", ["automation"]],
    // "harness" is shared by two neighbours, "cli-agent" by one.
    ["claude-code", ["harness", "cli-agent", "automation"]],
    ["hermes-agent", ["harness"]],
    ["rlhf", ["alignment"]],
  ]);

  const graph = parseArticleGraph({
    generatedOn: "2026-08-03",
    backlinks: { "agent-loop-pattern": ["hermes-agent"] },
    outgoing: { "agent-loop-pattern": ["claude-code"] },
    related: { "agent-loop-pattern": ["rlhf"] },
  });

  it("ranks neighbour tags by how many neighbours share them", () => {
    // Backlinks, outgoing and related all contribute; "harness" (2 neighbours)
    // outranks the singletons, which tie and fall back to alphabetical order.
    expect(deriveKeywords(subject, graph, tagsBySlug)).toBe(
      "harness alignment cli-agent"
    );
  });

  it("drops tags the article already carries", () => {
    // "automation" is on claude-code but is the subject's own tag, and own tags
    // are already indexed at a higher weight than keywords.
    expect(deriveKeywords(subject, graph, tagsBySlug)).not.toContain(
      "automation"
    );
  });

  it("honours the keyword limit", () => {
    expect(deriveKeywords(subject, graph, tagsBySlug, 1)).toBe("harness");
  });

  it("normalises weighted backlink edges to the same shape as bare slugs", () => {
    const weighted = parseArticleGraph({
      generatedOn: "2026-08-03",
      backlinks: {
        "agent-loop-pattern": [{ slug: "hermes-agent", count: 3 }],
      },
      outgoing: {},
      related: {},
    });
    expect(deriveKeywords(subject, weighted, tagsBySlug)).toBe("harness");
  });

  it("returns an empty string for an article with no neighbours", () => {
    const orphan = { ...subject, slug: "orphan" };
    expect(deriveKeywords(orphan, graph, tagsBySlug)).toBe("");
  });
});
