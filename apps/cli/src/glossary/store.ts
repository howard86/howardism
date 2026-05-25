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
 *
 * The busy timeout is armed FIRST so it covers the very first contended write
 * (the WAL switch + DDL on a fresh DB), eliminating a race where a concurrent
 * opener saw SQLITE_BUSY before the timeout was set.
 */
export function openDb(path: string = DEFAULT_GLOSSARY_DB_PATH): Database {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new Database(path, { create: true });
  // Arm the busy timeout FIRST so it covers every subsequent statement.
  db.run("PRAGMA busy_timeout = 10000;");
  // The WAL switch on a fresh DB grabs an EXCLUSIVE lock and, in practice,
  // bun:sqlite does not always honour busy_timeout for it under heavy
  // cross-process contention. Wrap the WAL switch + DDL in our own
  // retry-on-busy loop so concurrent openers settle deterministically. Both
  // statements use `IF NOT EXISTS` / no-op-on-WAL semantics, so retrying is
  // safe and idempotent.
  withBusyRetry(() => {
    db.run("PRAGMA journal_mode = WAL;");
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
  });
  return db;
}

/** Max attempts (inclusive) for {@link withBusyRetry} on a transient lock. */
const BUSY_RETRY_MAX_ATTEMPTS = 3;
/** Base backoff in ms for {@link withBusyRetry}; doubles per attempt. */
const BUSY_RETRY_BASE_MS = 50;

const isTransientLockError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") {
    return false;
  }
  const e = err as { code?: unknown; message?: unknown };
  const code = typeof e.code === "string" ? e.code : "";
  if (code === "SQLITE_BUSY" || code === "SQLITE_LOCKED") {
    return true;
  }
  const message = typeof e.message === "string" ? e.message : "";
  return message.toLowerCase().includes("database is locked");
};

/**
 * Run `fn` and, on a transient SQLite lock (`SQLITE_BUSY`/`SQLITE_LOCKED`,
 * or a message containing "database is locked"), retry up to 3 attempts
 * total with exponential backoff (50ms, 100ms, 200ms via `Bun.sleepSync`).
 * Non-lock errors rethrow immediately. The original error is rethrown after
 * the final retry. Defense-in-depth on top of the connection's busy timeout.
 */
function withBusyRetry<T>(fn: () => T): T {
  let lastErr: unknown;
  for (let attempt = 0; attempt < BUSY_RETRY_MAX_ATTEMPTS; attempt += 1) {
    try {
      return fn();
    } catch (err) {
      if (!isTransientLockError(err)) {
        throw err;
      }
      lastErr = err;
      if (attempt < BUSY_RETRY_MAX_ATTEMPTS - 1) {
        Bun.sleepSync(BUSY_RETRY_BASE_MS * 2 ** attempt);
      }
    }
  }
  throw lastErr;
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
  const result = withBusyRetry(() =>
    db
      .query(
        "INSERT OR IGNORE INTO glossary_term (term, category, notes, source) VALUES (?, ?, ?, ?)"
      )
      .run(trimmedTerm, trimmedCategory, notes, source)
  );
  return { added: result.changes === 1 };
}

interface NormalisedEntry {
  category: string;
  term: string;
}

const normaliseEntry = (
  entry: GlossaryEntry,
  index: number
): NormalisedEntry => {
  if (!entry || typeof entry !== "object") {
    throw new Error(
      `addTerms: entry at index ${index} must be an object with {term, category}`
    );
  }
  const { term, category } = entry;
  if (typeof term !== "string" || !term.trim()) {
    throw new Error(
      `addTerms: entry at index ${index} must have a non-empty string \`term\``
    );
  }
  if (typeof category !== "string" || !category.trim()) {
    throw new Error(
      `addTerms: entry at index ${index} must have a non-empty string \`category\``
    );
  }
  return { term: term.trim(), category: category.trim() };
};

/**
 * Batch-insert glossary entries inside a single transaction. Idempotent and
 * case-insensitive (via the unique `lower(term)` index): rows already present
 * — in any case — are silently ignored. Validation mirrors {@link addTerm}:
 * `entries` must be an array, and every entry must have non-empty string
 * `term` and `category`. Returns `{ added }` = number of rows actually
 * inserted (excludes duplicates and pre-existing rows).
 *
 * One transaction per call keeps N writes to a single fsync, which makes
 * concurrent agents friendlier neighbours on the WAL than N separate
 * `INSERT OR IGNORE` round-trips.
 */
export function addTerms(
  db: Database,
  entries: GlossaryEntry[],
  opts: AddTermOptions = {}
): { added: number } {
  if (!Array.isArray(entries)) {
    throw new Error("addTerms: entries must be an array");
  }
  const normalised = entries.map(normaliseEntry);
  if (normalised.length === 0) {
    return { added: 0 };
  }
  const source = opts.source?.trim() || "agent";
  const notes = opts.notes?.trim() || null;
  const insert = db.query(
    "INSERT OR IGNORE INTO glossary_term (term, category, notes, source) VALUES (?, ?, ?, ?)"
  );
  const insertAll = db.transaction((items: NormalisedEntry[]): number => {
    let added = 0;
    for (const item of items) {
      const result = insert.run(item.term, item.category, notes, source);
      if (result.changes === 1) {
        added += 1;
      }
    }
    return added;
  });
  const added = withBusyRetry(() => insertAll(normalised));
  return { added };
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
  // Cold-start path: several glossary processes can race to seed an empty DB.
  // Retry on a transient lock like every other writer (the `n > 0` guard plus
  // INSERT OR IGNORE keep a re-run idempotent).
  withBusyRetry(() => insertAll(rows));
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
