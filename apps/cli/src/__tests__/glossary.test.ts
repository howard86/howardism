import { describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  addTerm,
  BASE_TECH_TERMS,
  listTerms,
  loadGlossary,
  seed,
  seedIfMissing,
} from "../translate/glossary.ts";

interface SeedFixture {
  articlesDir: string;
  glossaryPath: string;
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

const buildSeedFixture = async (): Promise<SeedFixture> => {
  const root = await mkdtemp(join(tmpdir(), "glossary-seed-"));
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

  const glossaryPath = join(root, ".translate-glossary.json");
  return { articlesDir, wikiSourcesPath, glossaryPath };
};

describe("seed", () => {
  it("includes Entity-tag titles AND slugs, authors, and base tech terms (deduped case-insensitively)", async () => {
    const fix = await buildSeedFixture();
    const result = await seed({
      articlesDir: fix.articlesDir,
      wikiSourcesPath: fix.wikiSourcesPath,
    });
    const terms = result.terms.map((t) => t.term);

    // Entity-tag titles + slugs are both seeded when they differ
    // case-insensitively (e.g. title "Boris Cherny" vs slug "boris-cherny").
    expect(terms).toContain("Boris Cherny");
    expect(terms).toContain("boris-cherny");
    // For "Anthropic" the title and the slug are case-insensitively identical,
    // so dedupe collapses them — only the first encountered (the title) wins.
    expect(terms).toContain("Anthropic");
    // Concept-tag article should NOT be in the glossary
    expect(terms).not.toContain("Agent Loop Pattern");
    expect(terms).not.toContain("agent-loop-pattern");

    // Authors from wiki-sources.json
    expect(terms).toContain("Lenny Rachitsky");
    expect(terms).toContain("Matt Pocock");

    // Base tech terms
    for (const tech of BASE_TECH_TERMS) {
      expect(terms).toContain(tech);
    }

    // Categories: Entity titles/slugs are "entity"; authors are "person"; tech are "tech"
    const cat = (term: string): string =>
      result.terms.find((t) => t.term === term)?.category ?? "";
    expect(cat("Boris Cherny")).toBe("entity");
    expect(cat("Lenny Rachitsky")).toBe("person");
    expect(cat("MCP")).toBe("tech");

    // Dedupe — no duplicate `term` (case-insensitive). Note "anthropic" and "Anthropic"
    // ARE different cases; the dedupe drops the second occurrence regardless of case.
    const lowered = terms.map((t) => t.toLowerCase());
    expect(new Set(lowered).size).toBe(lowered.length);
  });

  it("returns base tech terms even when articles dir is missing", async () => {
    const fix = await buildSeedFixture();
    const result = await seed({
      articlesDir: join(fix.articlesDir, "nonexistent"),
      wikiSourcesPath: fix.wikiSourcesPath,
    });
    const terms = result.terms.map((t) => t.term);
    expect(terms).toContain("MCP");
    expect(terms).toContain("Lenny Rachitsky");
  });
});

describe("seedIfMissing", () => {
  it("writes a fresh glossary when the file does not exist", async () => {
    const fix = await buildSeedFixture();
    await seedIfMissing(fix.glossaryPath, {
      articlesDir: fix.articlesDir,
      wikiSourcesPath: fix.wikiSourcesPath,
    });
    const loaded = await loadGlossary(fix.glossaryPath);
    expect(loaded.terms.length).toBeGreaterThan(0);
    expect(loaded.terms.some((t) => t.term === "Boris Cherny")).toBe(true);
  });

  it("does not overwrite an existing DB", async () => {
    const fix = await buildSeedFixture();
    await writeFile(
      fix.glossaryPath,
      JSON.stringify({ terms: [{ term: "Custom", category: "tech" }] }),
      "utf8"
    );
    await seedIfMissing(fix.glossaryPath, {
      articlesDir: fix.articlesDir,
      wikiSourcesPath: fix.wikiSourcesPath,
    });
    const loaded = await loadGlossary(fix.glossaryPath);
    expect(loaded.terms).toEqual([{ term: "Custom", category: "tech" }]);
  });

  it("re-seeds an empty (0-byte) DB instead of treating it as seeded", async () => {
    const fix = await buildSeedFixture();
    await writeFile(fix.glossaryPath, "", "utf8");
    await seedIfMissing(fix.glossaryPath, {
      articlesDir: fix.articlesDir,
      wikiSourcesPath: fix.wikiSourcesPath,
    });
    const loaded = await loadGlossary(fix.glossaryPath);
    expect(loaded.terms.some((t) => t.term === "Boris Cherny")).toBe(true);
  });

  it("re-seeds a corrupt (unparseable) DB", async () => {
    const fix = await buildSeedFixture();
    await writeFile(fix.glossaryPath, "{ not valid json", "utf8");
    await seedIfMissing(fix.glossaryPath, {
      articlesDir: fix.articlesDir,
      wikiSourcesPath: fix.wikiSourcesPath,
    });
    const loaded = await loadGlossary(fix.glossaryPath);
    expect(loaded.terms.some((t) => t.term === "MCP")).toBe(true);
  });
});

describe("loadGlossary", () => {
  it("returns an empty glossary for a corrupt DB instead of throwing", async () => {
    const root = await mkdtemp(join(tmpdir(), "glossary-corrupt-"));
    const path = join(root, "g.json");
    await writeFile(path, "}{garbage", "utf8");
    expect(await loadGlossary(path)).toEqual({ terms: [] });
  });
});

describe("listTerms", () => {
  it("returns the seeded + manually added terms", async () => {
    const fix = await buildSeedFixture();
    await seedIfMissing(fix.glossaryPath, {
      articlesDir: fix.articlesDir,
      wikiSourcesPath: fix.wikiSourcesPath,
    });
    await addTerm(fix.glossaryPath, "Cowork", "product");

    const terms = await listTerms(fix.glossaryPath);
    const names = terms.map((t) => t.term);
    expect(names).toContain("Boris Cherny");
    expect(names).toContain("Lenny Rachitsky");
    expect(names).toContain("Cowork");
  });

  it("returns an empty list when the DB does not exist", async () => {
    const root = await mkdtemp(join(tmpdir(), "glossary-empty-"));
    const path = join(root, "absent.json");
    expect(await listTerms(path)).toEqual([]);
  });
});

describe("addTerm", () => {
  it("appends a new term", async () => {
    const root = await mkdtemp(join(tmpdir(), "glossary-add-"));
    const path = join(root, "g.json");
    const result = await addTerm(path, "Hermes", "product");
    expect(result.added).toBe(true);
    const terms = await listTerms(path);
    expect(terms).toEqual([{ term: "Hermes", category: "product" }]);
  });

  it("is idempotent (case-insensitive on term)", async () => {
    const root = await mkdtemp(join(tmpdir(), "glossary-add-idem-"));
    const path = join(root, "g.json");
    await addTerm(path, "Cowork", "product");
    const r1 = await addTerm(path, "cowork", "product");
    const r2 = await addTerm(path, "COWORK", "product");
    expect(r1.added).toBe(false);
    expect(r2.added).toBe(false);
    const terms = await listTerms(path);
    expect(terms.length).toBe(1);
    expect(terms[0].term).toBe("Cowork");
  });

  it("rejects empty terms or categories", async () => {
    const root = await mkdtemp(join(tmpdir(), "glossary-add-bad-"));
    const path = join(root, "g.json");
    await expect(addTerm(path, "  ", "tech")).rejects.toThrow();
    await expect(addTerm(path, "OK", " ")).rejects.toThrow();
  });

  it("trims whitespace around the term and category", async () => {
    const root = await mkdtemp(join(tmpdir(), "glossary-add-trim-"));
    const path = join(root, "g.json");
    await addTerm(path, "  Hermes  ", "  product  ");
    const terms = await listTerms(path);
    expect(terms).toEqual([{ term: "Hermes", category: "product" }]);
  });

  it("survives parallel adds without losing terms", async () => {
    const root = await mkdtemp(join(tmpdir(), "glossary-add-race-"));
    const path = join(root, "g.json");
    await Promise.all(
      ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"].map((term) =>
        addTerm(path, term, "tech")
      )
    );
    const terms = await listTerms(path);
    const names = terms.map((t) => t.term).sort();
    expect(names).toEqual(["Alpha", "Beta", "Delta", "Epsilon", "Gamma"]);
  });
});
