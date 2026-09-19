import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArticleGraph } from "@howardism/article-contract/manifests/graph";

import {
  buildIndex,
  buildSearchEntry,
  deriveKeywords,
  type PartialSearchEntry,
} from "../search-index.ts";

const HERE = dirname(new URL(import.meta.url).pathname);
const GRAPH_PATH = resolve(
  HERE,
  "../../../../apps/blog/src/data/article-graph.json"
);

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
    related: { "agent-loop-pattern": ["rlhf"] },
  });
  const outgoing = new Map([["agent-loop-pattern", ["claude-code"]]]);

  it("ranks neighbour tags by how many neighbours share them", () => {
    // Backlinks, outgoing and related all contribute; "harness" (2 neighbours)
    // outranks the singletons, which tie and fall back to alphabetical order.
    expect(deriveKeywords(subject, graph, tagsBySlug, outgoing)).toBe(
      "harness alignment cli-agent"
    );
  });

  it("drops tags the article already carries", () => {
    // "automation" is on claude-code but is the subject's own tag, and own tags
    // are already indexed at a higher weight than keywords.
    expect(deriveKeywords(subject, graph, tagsBySlug, outgoing)).not.toContain(
      "automation"
    );
  });

  it("honours the keyword limit", () => {
    expect(deriveKeywords(subject, graph, tagsBySlug, outgoing, 1)).toBe(
      "harness"
    );
  });

  it("normalises weighted backlink edges to the same shape as bare slugs", () => {
    const weighted = parseArticleGraph({
      generatedOn: "2026-08-03",
      backlinks: {
        "agent-loop-pattern": [{ slug: "hermes-agent", count: 3 }],
      },
      related: {},
    });
    expect(deriveKeywords(subject, weighted, tagsBySlug, new Map())).toBe(
      "harness"
    );
  });

  it("returns an empty string for an article with no neighbours", () => {
    const orphan = { ...subject, slug: "orphan" };
    expect(deriveKeywords(orphan, graph, tagsBySlug, outgoing)).toBe("");
  });
});

describe("buildIndex", () => {
  // The importer calls writeSearchIndex right after writing article-graph.json
  // from the object it holds, so it passes that object in rather than have the
  // 1.7 MB manifest read and re-validated straight back off disk. The two
  // paths must agree, or `import:wiki` and `build:search-index` would emit
  // different indexes from the same corpus.
  it("gives the same index whether the graph is injected or read", async () => {
    const graph = parseArticleGraph(
      JSON.parse(await readFile(GRAPH_PATH, "utf8"))
    );
    const [fromDisk, injected] = await Promise.all([
      buildIndex("2026-05-14"),
      buildIndex("2026-05-14", graph),
    ]);
    expect(injected).toEqual(fromDisk);
  });

  it("indexes against the injected graph, not the committed one", async () => {
    // An empty graph has no neighbours to draw keywords from, so every entry
    // loses them — which only happens if the injected graph is really used.
    const injected = await buildIndex("2026-05-14", {
      generatedOn: "2026-05-14",
      backlinks: {},
      related: {},
    });
    expect(injected.entries.length).toBeGreaterThan(0);
    expect(injected.entries.every((entry) => entry.keywords === "")).toBe(true);
  });
});
