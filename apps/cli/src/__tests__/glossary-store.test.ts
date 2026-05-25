import type { Database } from "bun:sqlite";
import { describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { BASE_TECH_TERMS, harvestSeedEntries } from "../glossary/seed.ts";
import {
  addTerm,
  ensureSeeded,
  listTerms,
  openDb,
  searchTerms,
} from "../glossary/store.ts";

interface Fixture {
  articlesDir: string;
  dbPath: string;
  jsonPath: string;
  wikiSourcesPath: string;
}

const writeArticle = async (
  dir: string,
  slug: string,
  frontmatter: Record<string, string>
): Promise<void> => {
  const lines = ["---"];
  for (const [k, v] of Object.entries(frontmatter)) {
    lines.push(`${k}: ${v}`);
  }
  lines.push(
    "---",
    "",
    `export { default as heroImage } from "../assets/${slug}.png";`,
    "",
    "Body."
  );
  await writeFile(join(dir, `${slug}.mdx`), lines.join("\n"), "utf8");
};

const buildFixture = async (): Promise<Fixture> => {
  const root = await mkdtemp(join(tmpdir(), "glossary-store-"));
  const articlesDir = join(root, "articles");
  await mkdir(articlesDir, { recursive: true });

  await writeArticle(articlesDir, "boris-cherny", {
    date: "2026-05-23",
    title: "Boris Cherny",
    description: "IC voice on Claude Code",
    tag: "Entity",
    readingTime: "4",
    imageAlt: "Illustration for Boris Cherny",
  });
  await writeArticle(articlesDir, "agent-loop-pattern", {
    date: "2026-05-06",
    title: "Agent Loop Pattern",
    description: "loops are the future",
    tag: "Concept",
    readingTime: "7",
    imageAlt: "Illustration for Agent Loop Pattern",
  });
  await writeArticle(articlesDir, "anthropic", {
    date: "2026-04-01",
    title: "Anthropic",
    description: "AI safety lab",
    tag: "Entity",
    readingTime: "3",
    imageAlt: "Illustration for Anthropic",
  });

  const wikiSourcesPath = join(root, "wiki-sources.json");
  await writeFile(
    wikiSourcesPath,
    JSON.stringify({
      generatedOn: "2026-05-23",
      sources: [
        { title: "T1", author: "Lenny Rachitsky", citedBy: [], kind: "Talk" },
        { title: "T2", author: "Matt Pocock", citedBy: [], kind: "Talk" },
        { title: "T3", citedBy: [], kind: "Article" },
      ],
    }),
    "utf8"
  );

  return {
    articlesDir,
    wikiSourcesPath,
    dbPath: join(root, ".translate-glossary.db"),
    jsonPath: join(root, ".translate-glossary.json"),
  };
};

const sourceOf = (db: Database, term: string): string =>
  (
    db.query("SELECT source FROM glossary_term WHERE term = ?").get(term) as {
      source: string;
    } | null
  )?.source ?? "";

describe("openDb", () => {
  it("creates an empty, queryable table", async () => {
    const fix = await buildFixture();
    const db = openDb(fix.dbPath);
    expect(listTerms(db)).toEqual([]);
    db.close();
  });
});

describe("addTerm", () => {
  it("appends a new term", async () => {
    const fix = await buildFixture();
    const db = openDb(fix.dbPath);
    expect(addTerm(db, "Hermes", "product").added).toBe(true);
    expect(listTerms(db)).toEqual([{ term: "Hermes", category: "product" }]);
    db.close();
  });

  it("is idempotent (case-insensitive on term)", async () => {
    const fix = await buildFixture();
    const db = openDb(fix.dbPath);
    addTerm(db, "Cowork", "product");
    expect(addTerm(db, "cowork", "product").added).toBe(false);
    expect(addTerm(db, "COWORK", "product").added).toBe(false);
    const terms = listTerms(db);
    expect(terms.length).toBe(1);
    expect(terms[0]?.term).toBe("Cowork");
    db.close();
  });

  it("rejects empty terms or categories", async () => {
    const fix = await buildFixture();
    const db = openDb(fix.dbPath);
    expect(() => addTerm(db, "  ", "tech")).toThrow();
    expect(() => addTerm(db, "OK", " ")).toThrow();
    db.close();
  });

  it("trims whitespace around the term and category", async () => {
    const fix = await buildFixture();
    const db = openDb(fix.dbPath);
    addTerm(db, "  Hermes  ", "  product  ");
    expect(listTerms(db)).toEqual([{ term: "Hermes", category: "product" }]);
    db.close();
  });

  it("records notes and provenance", async () => {
    const fix = await buildFixture();
    const db = openDb(fix.dbPath);
    addTerm(db, "MenuGen", "product", {
      notes: "side project",
      source: "manual",
    });
    expect(sourceOf(db, "MenuGen")).toBe("manual");
    expect(searchTerms(db, "menugen")[0]?.notes).toBe("side project");
    db.close();
  });
});

describe("listTerms", () => {
  it("filters by category", async () => {
    const fix = await buildFixture();
    const db = openDb(fix.dbPath);
    addTerm(db, "Anthropic", "org");
    addTerm(db, "MCP", "tech");
    addTerm(db, "RAG", "tech");
    const tech = listTerms(db, "tech")
      .map((t) => t.term)
      .sort();
    expect(tech).toEqual(["MCP", "RAG"]);
    db.close();
  });
});

describe("searchTerms", () => {
  it("matches case-insensitive substrings and returns notes", async () => {
    const fix = await buildFixture();
    const db = openDb(fix.dbPath);
    addTerm(db, "Claude Code", "product", { notes: "the CLI" });
    const matches = searchTerms(db, "claude");
    expect(matches.map((m) => m.term)).toContain("Claude Code");
    expect(matches[0]?.notes).toBe("the CLI");
    expect(searchTerms(db, "   ")).toEqual([]);
    db.close();
  });
});

describe("harvestSeedEntries", () => {
  it("includes Entity titles + slugs, authors, and base tech (deduped)", async () => {
    const fix = await buildFixture();
    const entries = await harvestSeedEntries({
      articlesDir: fix.articlesDir,
      wikiSourcesPath: fix.wikiSourcesPath,
    });
    const terms = entries.map((e) => e.term);

    expect(terms).toContain("Boris Cherny");
    expect(terms).toContain("boris-cherny");
    expect(terms).toContain("Anthropic");
    expect(terms).not.toContain("Agent Loop Pattern");
    expect(terms).not.toContain("agent-loop-pattern");
    expect(terms).toContain("Lenny Rachitsky");
    expect(terms).toContain("Matt Pocock");
    for (const tech of BASE_TECH_TERMS) {
      expect(terms).toContain(tech);
    }

    const cat = (term: string): string =>
      entries.find((e) => e.term === term)?.category ?? "";
    expect(cat("Boris Cherny")).toBe("entity");
    expect(cat("Lenny Rachitsky")).toBe("person");
    expect(cat("MCP")).toBe("tech");

    const lowered = terms.map((t) => t.toLowerCase());
    expect(new Set(lowered).size).toBe(lowered.length);
  });

  it("returns base tech terms even when the articles dir is missing", async () => {
    const fix = await buildFixture();
    const entries = await harvestSeedEntries({
      articlesDir: join(fix.articlesDir, "nonexistent"),
      wikiSourcesPath: fix.wikiSourcesPath,
    });
    const terms = entries.map((e) => e.term);
    expect(terms).toContain("MCP");
    expect(terms).toContain("Lenny Rachitsky");
  });
});

describe("ensureSeeded", () => {
  it("harvests the corpus into an empty DB", async () => {
    const fix = await buildFixture();
    const db = openDb(fix.dbPath);
    await ensureSeeded(
      db,
      { articlesDir: fix.articlesDir, wikiSourcesPath: fix.wikiSourcesPath },
      null
    );
    const terms = listTerms(db).map((t) => t.term);
    expect(terms).toContain("Boris Cherny");
    expect(terms).toContain("Lenny Rachitsky");
    expect(terms).toContain("MCP");
    expect(sourceOf(db, "MCP")).toBe("seed");
    db.close();
  });

  it("imports legacy JSON (source='migrated') AND harvests gaps (source='seed')", async () => {
    const fix = await buildFixture();
    await writeFile(
      fix.jsonPath,
      JSON.stringify({
        terms: [
          { term: "OpenClaw", category: "product" },
          { term: "Vercel", category: "org" },
        ],
      }),
      "utf8"
    );
    const db = openDb(fix.dbPath);
    await ensureSeeded(
      db,
      { articlesDir: fix.articlesDir, wikiSourcesPath: fix.wikiSourcesPath },
      fix.jsonPath
    );
    const terms = listTerms(db).map((t) => t.term);
    // hand-added terms preserved from JSON
    expect(terms).toContain("OpenClaw");
    expect(terms).toContain("Vercel");
    expect(sourceOf(db, "OpenClaw")).toBe("migrated");
    // corpus harvest still fills the rest
    expect(terms).toContain("MCP");
    expect(sourceOf(db, "MCP")).toBe("seed");
    db.close();
  });

  it("skips legacy entries with an empty term or category", async () => {
    const fix = await buildFixture();
    await writeFile(
      fix.jsonPath,
      JSON.stringify({
        terms: [
          { term: "Junk", category: "" },
          { term: "", category: "product" },
          { term: "OpenClaw", category: "product" },
        ],
      }),
      "utf8"
    );
    const db = openDb(fix.dbPath);
    await ensureSeeded(
      db,
      { articlesDir: fix.articlesDir, wikiSourcesPath: fix.wikiSourcesPath },
      fix.jsonPath
    );
    const terms = listTerms(db).map((t) => t.term);
    expect(terms).not.toContain("Junk");
    expect(terms).toContain("OpenClaw");
    db.close();
  });

  it("leaves a populated DB untouched (added terms persist)", async () => {
    const fix = await buildFixture();
    const db = openDb(fix.dbPath);
    addTerm(db, "Custom", "tech");
    await ensureSeeded(
      db,
      { articlesDir: fix.articlesDir, wikiSourcesPath: fix.wikiSourcesPath },
      null
    );
    expect(listTerms(db)).toEqual([{ term: "Custom", category: "tech" }]);
    db.close();
  });

  it("ignores a corrupt legacy JSON and still harvests", async () => {
    const fix = await buildFixture();
    await writeFile(fix.jsonPath, "{ not valid json", "utf8");
    const db = openDb(fix.dbPath);
    await ensureSeeded(
      db,
      { articlesDir: fix.articlesDir, wikiSourcesPath: fix.wikiSourcesPath },
      fix.jsonPath
    );
    expect(listTerms(db).map((t) => t.term)).toContain("MCP");
    db.close();
  });
});

describe("concurrency (WAL, two connections to one file)", () => {
  it("keeps a single row when both connections add the same term", async () => {
    const fix = await buildFixture();
    const a = openDb(fix.dbPath);
    const b = openDb(fix.dbPath);
    const r1 = addTerm(a, "Shared", "tech");
    const r2 = addTerm(b, "shared", "tech");
    expect(r1.added).toBe(true);
    expect(r2.added).toBe(false);
    expect(
      listTerms(a).filter((t) => t.term.toLowerCase() === "shared").length
    ).toBe(1);
    a.close();
    b.close();
  });

  it("persists distinct terms written across connections", async () => {
    const fix = await buildFixture();
    const a = openDb(fix.dbPath);
    const b = openDb(fix.dbPath);
    addTerm(a, "Alpha", "tech");
    addTerm(b, "Beta", "tech");
    addTerm(a, "Gamma", "tech");
    const names = listTerms(b)
      .map((t) => t.term)
      .sort();
    expect(names).toEqual(["Alpha", "Beta", "Gamma"]);
    a.close();
    b.close();
  });
});
