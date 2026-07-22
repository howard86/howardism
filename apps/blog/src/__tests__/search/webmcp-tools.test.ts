import { describe, expect, it } from "bun:test";

import type { SearchEntry } from "@/components/search/search-data";
import { getArticle, searchArticles } from "@/components/search/webmcp-tools";

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
    slug: "rlhf",
    title: "RLHF",
    description: "Reinforcement learning from human feedback.",
    tag: "Concept",
    domain: "llm-architecture",
    tags: ["alignment"],
    body: "Reward models shape model behaviour during alignment training.",
  },
];

describe("searchArticles", () => {
  it("returns matching slugs, shaped for an agent, without the body", () => {
    const json = searchArticles(
      entries,
      { query: "loop" },
      "https://www.howardism.dev"
    );
    const results = JSON.parse(json) as Record<string, unknown>[];

    expect(results.map((r) => r.slug)).toContain("agent-loop-pattern");
    expect(results.every((r) => !("body" in r))).toBe(true);

    const match = results.find((r) => r.slug === "agent-loop-pattern");
    expect(match?.url).toBe(
      "https://www.howardism.dev/articles/agent-loop-pattern"
    );
    expect(match?.title).toBe("Agent Loop Pattern");
  });

  it("returns nothing for a blank query", () => {
    const json = searchArticles(
      entries,
      { query: "   " },
      "https://www.howardism.dev"
    );
    expect(JSON.parse(json)).toEqual([]);
  });
});

describe("getArticle", () => {
  it("returns the body for a known slug", () => {
    expect(getArticle(entries, { slug: "rlhf" })).toBe(
      "Reward models shape model behaviour during alignment training."
    );
  });

  it("returns a not-found message for an unknown slug", () => {
    const result = getArticle(entries, { slug: "does-not-exist" });
    expect(result).toContain("does-not-exist");
    expect(result).not.toBe(entries[0]?.body);
  });
});
