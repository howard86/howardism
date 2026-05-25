import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { harvestSeedEntries, type SeedSources } from "./seed.ts";

const HERE = dirname(new URL(import.meta.url).pathname);
const CLI_ROOT = resolve(HERE, "../../");
const REPO_ROOT = resolve(CLI_ROOT, "../../");

/** SQLite store; per-machine local cache, gitignored (see apps/cli/.gitignore). */
export const DEFAULT_GLOSSARY_DB_PATH = resolve(
  CLI_ROOT,
  ".translate-glossary.db"
);
/** Legacy JSON store; migrated into SQLite on first seed if present. */
export const LEGACY_GLOSSARY_JSON_PATH = resolve(
  CLI_ROOT,
  ".translate-glossary.json"
);
export const DEFAULT_ARTICLES_DIR = resolve(
  REPO_ROOT,
  "apps/blog/src/content/articles"
);
export const DEFAULT_WIKI_SOURCES_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/data/wiki-sources.json"
);

export const GLOSSARY_CATEGORIES = [
  "person",
  "org",
  "product",
  "tech",
  "entity",
] as const;

export type GlossaryCategory = (typeof GLOSSARY_CATEGORIES)[number];

export interface GlossaryEntry {
  category: string;
  term: string;
}

export interface GlossaryMatch extends GlossaryEntry {
  notes: string | null;
}

export interface AddTermOptions {
  notes?: string;
  /** Provenance: 'agent' (default), 'migrated', 'seed', or 'manual'. */
  source?: string;
}

/**
 * Open (creating if needed) the SQLite glossary DB and ensure its schema.
 * WAL + a busy timeout let multiple processes (parallel engine subprocesses,
 * several MCP clients) read/write the same file without a bespoke lock — the
 * unique `lower(term)` index makes `addTerm` an idempotent `INSERT OR IGNORE`.
 */
export function openDb(path: string = DEFAULT_GLOSSARY_DB_PATH): Database {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new Database(path, { create: true });
  db.run("PRAGMA journal_mode = WAL;");
  db.run("PRAGMA busy_timeout = 5000;");
  db.run(`
    CREATE TABLE IF NOT EXISTS glossary_term (
      id         INTEGER PRIMARY KEY,
      term       TEXT NOT NULL,
      category   TEXT NOT NULL,
      notes      TEXT,
      source     TEXT NOT NULL DEFAULT 'agent',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.run(
    "CREATE UNIQUE INDEX IF NOT EXISTS ux_glossary_term ON glossary_term(lower(term));"
  );
  return db;
}

/**
 * List terms (optionally filtered by category), alphabetically by term.
 * Returns `{term, category}` only — the contract the translation prompt and
 * the legacy CLI consumers rely on.
 */
export function listTerms(db: Database, category?: string): GlossaryEntry[] {
  if (category?.trim()) {
    return db
      .query(
        "SELECT term, category FROM glossary_term WHERE category = ? ORDER BY term"
      )
      .all(category.trim()) as GlossaryEntry[];
  }
  return db
    .query("SELECT term, category FROM glossary_term ORDER BY term")
    .all() as GlossaryEntry[];
}

/**
 * Add a term. Idempotent and case-insensitive (via the unique `lower(term)`
 * index): a term already present — in any case — is left untouched and
 * `added: false` is returned. Category is required but, matching the legacy
 * store, not constrained to {@link GLOSSARY_CATEGORIES} here (the MCP layer
 * enforces the enum); empty term/category throw.
 */
export function addTerm(
  db: Database,
  term: string,
  category: string,
  opts: AddTermOptions = {}
): { added: boolean } {
  const trimmedTerm = term.trim();
  if (!trimmedTerm) {
    throw new Error("addTerm: term must be a non-empty string");
  }
  const trimmedCategory = category.trim();
  if (!trimmedCategory) {
    throw new Error("addTerm: category must be a non-empty string");
  }
  const notes = opts.notes?.trim() || null;
  const source = opts.source?.trim() || "agent";
  const result = db
    .query(
      "INSERT OR IGNORE INTO glossary_term (term, category, notes, source) VALUES (?, ?, ?, ?)"
    )
    .run(trimmedTerm, trimmedCategory, notes, source);
  return { added: result.changes === 1 };
}

/** Substring (case-insensitive) lookup over `term`; returns notes too. */
export function searchTerms(db: Database, query: string): GlossaryMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }
  return db
    .query(
      "SELECT term, category, notes FROM glossary_term WHERE instr(lower(term), ?) > 0 ORDER BY term"
    )
    .all(q) as GlossaryMatch[];
}

interface LegacyEntry {
  category: string;
  term: string;
}

const readLegacyJsonTerms = async (
  jsonPath: string
): Promise<LegacyEntry[]> => {
  let raw: string;
  try {
    raw = await readFile(jsonPath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const terms = (parsed as { terms?: unknown })?.terms;
  if (!Array.isArray(terms)) {
    return [];
  }
  return terms.filter(
    (e): e is LegacyEntry =>
      !!e &&
      typeof e === "object" &&
      typeof (e as LegacyEntry).term === "string" &&
      typeof (e as LegacyEntry).category === "string"
  );
};

/**
 * Idempotent seed: only runs when the table is empty. (1) Migrates any legacy
 * `.translate-glossary.json` entries (preserving hand-added terms) tagged
 * `source='migrated'`, then (2) harvests the corpus for gaps tagged
 * `source='seed'`. A populated table is left untouched so terms added by
 * agents/CLI persist across reruns. Safe to call on every startup.
 */
export async function ensureSeeded(
  db: Database,
  sources: SeedSources,
  jsonPath: string | null = LEGACY_GLOSSARY_JSON_PATH
): Promise<void> {
  const { n } = db.query("SELECT count(*) AS n FROM glossary_term").get() as {
    n: number;
  };
  if (n > 0) {
    return;
  }

  const rows: Array<{ category: string; source: string; term: string }> = [];
  const seen = new Set<string>();
  const push = (term: string, category: string, source: string): void => {
    const key = term.trim().toLowerCase();
    // Skip empty term/category too — a malformed legacy JSON entry must not
    // migrate a junk row (matches addTerm, which rejects an empty category).
    if (!(key && category.trim()) || seen.has(key)) {
      return;
    }
    seen.add(key);
    rows.push({ term: term.trim(), category: category.trim(), source });
  };

  if (jsonPath) {
    for (const entry of await readLegacyJsonTerms(jsonPath)) {
      push(entry.term, entry.category, "migrated");
    }
  }
  for (const entry of await harvestSeedEntries(sources)) {
    push(entry.term, entry.category, "seed");
  }

  const insert = db.query(
    "INSERT OR IGNORE INTO glossary_term (term, category, source) VALUES (?, ?, ?)"
  );
  const insertAll = db.transaction((items: typeof rows): void => {
    for (const r of items) {
      insert.run(r.term, r.category, r.source);
    }
  });
  insertAll(rows);
}

/**
 * Convenience wrapper: open the DB at `dbPath`, ensure it's seeded, then close.
 * Used by the translation orchestrator to seed once before spawning engines.
 */
export async function seedGlossary(
  dbPath: string,
  sources: SeedSources
): Promise<void> {
  const db = openDb(dbPath);
  try {
    await ensureSeeded(db, sources);
  } finally {
    db.close();
  }
}
