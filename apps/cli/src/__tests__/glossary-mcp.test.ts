import type { Database } from "bun:sqlite";
import { afterAll, describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  glossaryAddHandler,
  glossaryListHandler,
  glossarySearchHandler,
} from "../glossary/mcp.ts";
import { openDb } from "../glossary/store.ts";

const parse = (res: { content: { text: string }[] }): unknown =>
  JSON.parse(res.content[0]?.text ?? "null");

// A real file rather than :memory:, so the batch goes through the same WAL
// path a running MCP server would. Never the repo's own .translate-glossary.db.
const tempDirs: string[] = [];
const openTempDb = async (): Promise<Database> => {
  const dir = await mkdtemp(join(tmpdir(), "glossary-mcp-"));
  tempDirs.push(dir);
  return openDb(join(dir, "glossary.db"));
};

afterAll(async () => {
  await Promise.all(
    tempDirs.map((dir) => rm(dir, { recursive: true, force: true }))
  );
});

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

describe("glossary_add batch form", () => {
  interface AddResult {
    added: number;
    results: { added: boolean; category: string; term: string }[];
  }

  it("registers every term and reports each one", async () => {
    const db = await openTempDb();
    glossaryAddHandler(db, { term: "Anthropic", category: "org" });

    const result = parse(
      glossaryAddHandler(db, {
        terms: [
          { term: "Bun", category: "tech" },
          { term: "Turborepo", category: "tech" },
          // Already present, in a different case — idempotent, so not counted.
          { term: "anthropic", category: "org" },
        ],
      })
    ) as AddResult;

    expect(result.added).toBe(2);
    expect(result.results).toEqual([
      { term: "Bun", category: "tech", added: true },
      { term: "Turborepo", category: "tech", added: true },
      { term: "anthropic", category: "org", added: false },
    ]);
    const all = parse(glossaryListHandler(db, {})) as { term: string }[];
    expect(all.map((t) => t.term).sort()).toEqual([
      "Anthropic",
      "Bun",
      "Turborepo",
    ]);
    db.close();
  });

  it("puts the whole batch in one transaction", async () => {
    const db = await openTempDb();
    // The point of the batch form: K terms cost one transaction (and one
    // fsync) instead of K, on top of K model round-trips instead of one.
    let transactions = 0;
    const counting = new Proxy(db, {
      get(target, prop, receiver) {
        if (prop === "transaction") {
          transactions += 1;
        }
        const value = Reflect.get(target, prop, receiver) as unknown;
        return typeof value === "function" ? value.bind(target) : value;
      },
    });

    const terms = Array.from({ length: 25 }, (_, i) => ({
      term: `Term${i}`,
      category: "tech" as const,
    }));
    const result = parse(glossaryAddHandler(counting, { terms })) as AddResult;

    expect(result.added).toBe(25);
    expect(transactions).toBe(1);
    expect((parse(glossaryListHandler(db, {})) as unknown[]).length).toBe(25);
    db.close();
  });

  it("keeps each entry's own notes", async () => {
    const db = await openTempDb();
    glossaryAddHandler(db, {
      terms: [
        { term: "Ultracite", category: "tech", notes: "the Biome preset" },
        { term: "Vercel", category: "org" },
      ],
    });
    const matches = parse(
      glossarySearchHandler(db, { query: "ultracite" })
    ) as { notes: string | null }[];
    expect(matches[0]?.notes).toBe("the Biome preset");
    const plain = parse(glossarySearchHandler(db, { query: "vercel" })) as {
      notes: string | null;
    }[];
    expect(plain[0]?.notes).toBeNull();
    db.close();
  });

  it("rejects a call carrying neither shape", async () => {
    const db = await openTempDb();
    const res = glossaryAddHandler(db, {});
    expect(res).toHaveProperty("isError", true);
    expect((parse(glossaryListHandler(db, {})) as unknown[]).length).toBe(0);
    db.close();
  });

  it("rejects an empty terms array", async () => {
    const db = await openTempDb();
    expect(glossaryAddHandler(db, { terms: [] })).toHaveProperty(
      "isError",
      true
    );
    db.close();
  });
});
