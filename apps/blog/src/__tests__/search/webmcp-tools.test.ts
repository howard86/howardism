import { describe, expect, it } from "bun:test";

import type { SearchEntry } from "@/components/search/search-data";
import { getArticle, searchArticles } from "@/components/search/webmcp-tools";

const ORIGIN = "https://www.howardism.dev";

const entries: SearchEntry[] = [
  {
    slug: "agent-loop-pattern",
    title: "Agent Loop Pattern",
    description: "Loops as a next-generation agent primitive.",
    tag: "Concept",
    domain: "ai-engineering",
    tags: ["automation"],
    keywords: "harness cli-agent orchestration",
  },
  {
    slug: "rlhf",
    title: "RLHF",
    description: "Reinforcement learning from human feedback.",
    tag: "Concept",
    domain: "llm-architecture",
    tags: ["alignment"],
    keywords: "safety evaluation reward-modelling",
  },
];

describe("searchArticles", () => {
  it("returns matching slugs, shaped for an agent, without match-only fields", () => {
    const json = searchArticles(entries, { query: "loop" }, ORIGIN);
    const results = JSON.parse(json) as Record<string, unknown>[];

    expect(results.map((r) => r.slug)).toContain("agent-loop-pattern");
    expect(results.every((r) => !("keywords" in r))).toBe(true);
    expect(results.every((r) => !("tags" in r))).toBe(true);

    const match = results.find((r) => r.slug === "agent-loop-pattern");
    expect(match?.url).toBe(`${ORIGIN}/articles/agent-loop-pattern`);
    expect(match?.title).toBe("Agent Loop Pattern");
  });

  it("ranks on keywords, so a neighbour's subject finds the article", () => {
    // "orchestration" appears nowhere in the entry's own title, summary or
    // tags — only in the keywords derived from its graph neighbours.
    const results = JSON.parse(
      searchArticles(entries, { query: "orchestration" }, ORIGIN)
    ) as Record<string, unknown>[];
    expect(results.map((r) => r.slug)).toContain("agent-loop-pattern");
  });

  it("returns nothing for a blank query", () => {
    expect(
      JSON.parse(searchArticles(entries, { query: "   " }, ORIGIN))
    ).toEqual([]);
  });
});

describe("getArticle", () => {
  it("returns metadata and keywords for a known slug, and says it is not the text", () => {
    const result = JSON.parse(
      getArticle(entries, { slug: "rlhf" }, ORIGIN)
    ) as Record<string, unknown>;

    expect(result.slug).toBe("rlhf");
    expect(result.description).toBe(
      "Reinforcement learning from human feedback."
    );
    expect(result.relatedKeywords).toEqual([
      "safety",
      "evaluation",
      "reward-modelling",
    ]);
    // The url is the only route to the prose, so it must always be present and
    // the payload must not read as though it were the article itself.
    expect(result.url).toBe(`${ORIGIN}/articles/rlhf`);
    expect(result.note).toContain("url");
  });

  it("returns an empty keyword list rather than [''] when there are none", () => {
    const bare: SearchEntry[] = [{ ...entries[0], keywords: "" }];
    const result = JSON.parse(
      getArticle(bare, { slug: "agent-loop-pattern" }, ORIGIN)
    ) as Record<string, unknown>;
    expect(result.relatedKeywords).toEqual([]);
  });

  it("returns a not-found message for an unknown slug", () => {
    const result = getArticle(entries, { slug: "does-not-exist" }, ORIGIN);
    expect(result).toContain("does-not-exist");
  });
});
