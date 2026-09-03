import { describe, expect, it } from "bun:test";

import {
  createFuse,
  resolveLimit,
  searchEntries,
} from "@howardism/article-contract/search";

import {
  buildSnippet,
  matchesQuery,
  type SearchEntry,
} from "@/components/search/search-data";

const entries: SearchEntry[] = [
  {
    slug: "agent-loop-pattern",
    title: "Agent Loop Pattern",
    description: "Loops as a next-generation agent primitive.",
    tag: "Concept",
    domain: "agent-systems",
    tags: ["automation"],
    keywords: "harness orchestration",
  },
  {
    slug: "claude-code",
    title: "Claude Code",
    description: "Anthropic's CLI coding agent.",
    tag: "Entity",
    domain: "agent-systems",
    tags: ["claude-code"],
    keywords: "loop-primitive cli-agent",
  },
  {
    slug: "rlhf",
    title: "RLHF",
    description: "Reinforcement learning from human feedback.",
    tag: "Concept",
    domain: "model-capability-and-training",
    tags: ["alignment"],
    keywords: "safety evaluation",
  },
];

describe("searchEntries ranking", () => {
  it("ranks a title match above a body-only match", () => {
    const fuse = createFuse(entries);
    const results = searchEntries(fuse, "loop");
    expect(results[0]?.slug).toBe("agent-loop-pattern");
    expect(results.map((r) => r.slug)).toContain("claude-code");
  });

  it("matches on a free-form tag", () => {
    const fuse = createFuse(entries);
    const results = searchEntries(fuse, "alignment");
    expect(results.map((r) => r.slug)).toContain("rlhf");
  });

  it("returns nothing for a blank query", () => {
    const fuse = createFuse(entries);
    expect(searchEntries(fuse, "   ")).toEqual([]);
  });

  it("filters out unrelated noise", () => {
    const fuse = createFuse(entries);
    expect(searchEntries(fuse, "zzzxyqq")).toHaveLength(0);
  });

  it("reuses one Fuse instance per entry array", () => {
    expect(createFuse(entries)).toBe(createFuse(entries));
    expect(createFuse([...entries])).not.toBe(createFuse(entries));
  });
});

describe("searchEntries limit", () => {
  // `limit` reaches this from the WebMCP `search_articles` tool, i.e. straight
  // from a calling agent, so it is clamped rather than trusted.
  it("clamps a caller-supplied limit into [1, 50]", () => {
    expect(resolveLimit(undefined)).toBe(12);
    expect(resolveLimit(Number.NaN)).toBe(12);
    expect(resolveLimit(0)).toBe(1);
    expect(resolveLimit(-5)).toBe(1);
    expect(resolveLimit(2.7)).toBe(2);
    expect(resolveLimit(1_000_000)).toBe(50);
  });

  it("honours a valid limit when ranking", () => {
    const fuse = createFuse(entries);
    expect(searchEntries(fuse, "loop", 1)).toHaveLength(1);
  });
});

describe("buildSnippet", () => {
  it("carves a window around the match and isolates the matched span", () => {
    const snippet = buildSnippet(
      "A loop repeatedly executes a prompt until a queue is empty.",
      "executes"
    );
    expect(snippet?.match).toBe("executes");
    expect(`${snippet?.before}${snippet?.match}${snippet?.after}`).toContain(
      "repeatedly executes a prompt"
    );
  });

  it("is case-insensitive", () => {
    const snippet = buildSnippet("The Loop Primitive matters.", "loop");
    expect(snippet?.match).toBe("Loop");
  });

  it("adds ellipses when the window is clipped on both sides", () => {
    const long = `${"x ".repeat(120)}needle${" y".repeat(120)}`;
    const snippet = buildSnippet(long, "needle");
    expect(snippet?.before.startsWith("…")).toBe(true);
    expect(snippet?.after.endsWith("…")).toBe(true);
  });

  it("falls back to a matching token when the full query is absent", () => {
    const snippet = buildSnippet(
      "alignment training matters",
      "reward alignment"
    );
    expect(snippet?.match).toBe("alignment");
  });

  it("prefers the longest matching token over the first one", () => {
    // Query order would pick "the" — present at index 0 of almost any prose —
    // and highlight a stopword instead of the word being searched for.
    const snippet = buildSnippet(
      "The transformer depends on an attention mechanism.",
      "the attention mechanism"
    );
    expect(snippet?.match).not.toBe("The");
    // "attention" and "mechanism" tie at nine characters; the sort is stable,
    // so the earlier of the two wins.
    expect(snippet?.match).toBe("attention");
  });

  it("returns null when nothing matches", () => {
    expect(buildSnippet("no overlap here", "xyzzy")).toBeNull();
    expect(buildSnippet("", "loop")).toBeNull();
  });
});

describe("matchesQuery", () => {
  // Same texts/queries buildSnippet's own tests exercise, but as a boolean:
  // matchesQuery(text, query.trim().toLowerCase()) must agree with
  // `buildSnippet(text, query) !== null` in every case.
  const CASES: [text: string, query: string][] = [
    ["A loop repeatedly executes a prompt until a queue is empty.", "executes"],
    ["The Loop Primitive matters.", "loop"],
    ["alignment training matters", "reward alignment"],
    [
      "The transformer depends on an attention mechanism.",
      "the attention mechanism",
    ],
    ["no overlap here", "xyzzy"],
    ["", "loop"],
    ["automation", "loop"],
    ["scheduling", "scheduling"],
    ["runtime", "   "],
  ];

  it("agrees with buildSnippet(text, query) !== null over a sample", () => {
    for (const [text, query] of CASES) {
      const lowerQuery = query.trim().toLowerCase();
      expect(matchesQuery(text, lowerQuery)).toBe(
        buildSnippet(text, query) !== null
      );
    }
  });
});
