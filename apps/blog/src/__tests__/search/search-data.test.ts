import { describe, expect, it } from "bun:test";

import {
  buildSnippet,
  createFuse,
  type SearchEntry,
  searchEntries,
} from "@/components/search/search-data";

const entries: SearchEntry[] = [
  {
    slug: "agent-loop-pattern",
    title: "Agent Loop Pattern",
    description: "Loops as a next-generation agent primitive.",
    tag: "Concept",
    domain: "ai-engineering",
    tags: ["automation"],
    body: "A loop repeatedly executes a prompt until a queue is empty.",
  },
  {
    slug: "claude-code",
    title: "Claude Code",
    description: "Anthropic's CLI coding agent.",
    tag: "Entity",
    domain: "ai-engineering",
    tags: ["claude-code"],
    body: "Claude Code mentions the loop primitive only in passing here.",
  },
  {
    slug: "rlhf",
    title: "RLHF",
    description: "Reinforcement learning from human feedback.",
    tag: "Concept",
    domain: "llm-architecture",
    tags: ["alignment"],
    body: "Reward models shape model behaviour during alignment training.",
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

  it("returns null when nothing matches", () => {
    expect(buildSnippet("no overlap here", "xyzzy")).toBeNull();
    expect(buildSnippet("", "loop")).toBeNull();
  });
});
