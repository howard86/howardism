import { describe, expect, it } from "bun:test";

import {
  DEFAULT_SEARCH_INDEX_PATH,
  knowledgeGetHandler,
  knowledgeSearchHandler,
} from "../knowledge/mcp.ts";

const parse = (res: { content: { text: string }[] }): unknown =>
  JSON.parse(res.content[0]?.text ?? "null");

const indexRaw = await Bun.file(DEFAULT_SEARCH_INDEX_PATH).json();
const KNOWN_SLUG = indexRaw.entries[0].slug as string;

describe("knowledge MCP tool handlers", () => {
  it("knowledge_search returns results for a plausible query, without body", async () => {
    const results = parse(
      await knowledgeSearchHandler(DEFAULT_SEARCH_INDEX_PATH, {
        query: "AI",
      })
    ) as Record<string, unknown>[];

    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result).not.toHaveProperty("body");
      expect(result).toHaveProperty("slug");
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("description");
      expect(result).toHaveProperty("tag");
    }
  });

  it("knowledge_get returns the full entry (including body) for a known slug", async () => {
    const entry = parse(
      await knowledgeGetHandler(DEFAULT_SEARCH_INDEX_PATH, {
        slug: KNOWN_SLUG,
      })
    ) as { body: string; slug: string };

    expect(entry.slug).toBe(KNOWN_SLUG);
    expect(typeof entry.body).toBe("string");
    expect(entry.body.length).toBeGreaterThan(0);
  });

  it("knowledge_get handles an unknown slug gracefully rather than throwing", async () => {
    const result = parse(
      await knowledgeGetHandler(DEFAULT_SEARCH_INDEX_PATH, {
        slug: "definitely-not-a-real-slug",
      })
    ) as { error: string };

    expect(result.error).toContain("definitely-not-a-real-slug");
  });
});
