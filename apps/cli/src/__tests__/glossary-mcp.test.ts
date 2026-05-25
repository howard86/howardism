import { describe, expect, it } from "bun:test";

import {
  glossaryAddHandler,
  glossaryListHandler,
  glossarySearchHandler,
} from "../glossary/mcp.ts";
import { openDb } from "../glossary/store.ts";

const parse = (res: { content: { text: string }[] }): unknown =>
  JSON.parse(res.content[0]?.text ?? "null");

describe("glossary MCP tool handlers", () => {
  it("glossary_add registers a term and is idempotent", () => {
    const db = openDb(":memory:");
    expect(
      parse(glossaryAddHandler(db, { term: "Hermes", category: "product" }))
    ).toEqual({
      added: true,
    });
    expect(
      parse(glossaryAddHandler(db, { term: "hermes", category: "product" }))
    ).toEqual({
      added: false,
    });
    db.close();
  });

  it("glossary_list returns registered terms and filters by category", () => {
    const db = openDb(":memory:");
    glossaryAddHandler(db, { term: "Anthropic", category: "org" });
    glossaryAddHandler(db, { term: "MCP", category: "tech" });

    const all = parse(glossaryListHandler(db, {})) as { term: string }[];
    expect(all.map((t) => t.term).sort()).toEqual(["Anthropic", "MCP"]);

    const tech = parse(glossaryListHandler(db, { category: "tech" })) as {
      term: string;
    }[];
    expect(tech.map((t) => t.term)).toEqual(["MCP"]);
    db.close();
  });

  it("glossary_search returns case-insensitive matches with notes", () => {
    const db = openDb(":memory:");
    glossaryAddHandler(db, {
      term: "Claude Code",
      category: "product",
      notes: "the CLI",
    });
    const matches = parse(glossarySearchHandler(db, { query: "claude" })) as {
      notes: string | null;
      term: string;
    }[];
    expect(matches.map((m) => m.term)).toContain("Claude Code");
    expect(matches[0]?.notes).toBe("the CLI");
    db.close();
  });
});
