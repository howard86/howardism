import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const HERE = dirname(new URL(import.meta.url).pathname);
const CLI_ROOT = resolve(HERE, "../../../");

/**
 * Append-only run history; per-machine local cache, gitignored (see
 * apps/cli/.gitignore). The durable, committed source of truth is the
 * `translations.json` projection — this DB just accumulates every run so cost
 * and duration can be analysed over time. A fresh clone starts with an empty
 * DB and that's fine: classification reads the committed projection, not here.
 */
export const DEFAULT_TRACKING_DB_PATH = resolve(
  CLI_ROOT,
  ".translate-tracking.db"
);

/** Provenance of a recorded run beyond a real engine name. */
export type RunEngine = string;

export interface TranslationRunInput {
  costUsd?: number | null;
  credits?: number | null;
  durationMs: number;
  engine: RunEngine;
  inputTokens?: number | null;
  locale?: string;
  model?: string | null;
  outputTokens?: number | null;
  slug: string;
  sourceHash: string;
  sourceTitle?: string | null;
}

export interface TranslationRun extends Required<TranslationRunInput> {
  id: number;
  ranAt: string;
}

const BUSY_RETRY_MAX_ATTEMPTS = 3;
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

/** Retry `fn` on a transient SQLite lock with exponential backoff (50/100/200ms). */
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
 * Open (creating if needed) the tracking DB and ensure its schema. Mirrors the
 * glossary store's WAL + busy-timeout + retry cold-start handling.
 */
export function openTrackingDb(
  path: string = DEFAULT_TRACKING_DB_PATH
): Database {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new Database(path, { create: true });
  db.run("PRAGMA busy_timeout = 10000;");
  withBusyRetry(() => {
    db.run("PRAGMA journal_mode = WAL;");
    db.run(`
      CREATE TABLE IF NOT EXISTS translation_run (
        id            INTEGER PRIMARY KEY,
        slug          TEXT NOT NULL,
        locale        TEXT NOT NULL DEFAULT 'zh-TW',
        source_hash   TEXT NOT NULL,
        source_title  TEXT,
        engine        TEXT NOT NULL,
        model         TEXT,
        cost_usd      REAL,
        credits       REAL,
        input_tokens  INTEGER,
        output_tokens INTEGER,
        duration_ms   INTEGER NOT NULL,
        ran_at        TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.run(
      "CREATE INDEX IF NOT EXISTS ix_run_slug ON translation_run(slug, id);"
    );
  });
  return db;
}

const DEFAULT_LOCALE = "zh-TW";

/**
 * Append run rows in a single transaction (one fsync). Called once at the end
 * of a translate run with every recorded result.
 */
export function recordRuns(
  db: Database,
  runs: TranslationRunInput[]
): { added: number } {
  if (runs.length === 0) {
    return { added: 0 };
  }
  const insert = db.query(
    `INSERT INTO translation_run
       (slug, locale, source_hash, source_title, engine, model,
        cost_usd, credits, input_tokens, output_tokens, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertAll = db.transaction((items: TranslationRunInput[]): number => {
    let added = 0;
    for (const r of items) {
      insert.run(
        r.slug,
        r.locale ?? DEFAULT_LOCALE,
        r.sourceHash,
        r.sourceTitle ?? null,
        r.engine,
        r.model ?? null,
        r.costUsd ?? null,
        r.credits ?? null,
        r.inputTokens ?? null,
        r.outputTokens ?? null,
        r.durationMs
      );
      added += 1;
    }
    return added;
  });
  const added = withBusyRetry(() => insertAll(runs));
  return { added };
}

interface RunRow {
  cost_usd: number | null;
  credits: number | null;
  duration_ms: number;
  engine: string;
  id: number;
  input_tokens: number | null;
  locale: string;
  model: string | null;
  output_tokens: number | null;
  ran_at: string;
  slug: string;
  source_hash: string;
  source_title: string | null;
}

const toRun = (row: RunRow): TranslationRun => ({
  id: row.id,
  slug: row.slug,
  locale: row.locale,
  sourceHash: row.source_hash,
  sourceTitle: row.source_title,
  engine: row.engine,
  model: row.model,
  costUsd: row.cost_usd,
  credits: row.credits,
  inputTokens: row.input_tokens,
  outputTokens: row.output_tokens,
  durationMs: row.duration_ms,
  ranAt: row.ran_at,
});

/**
 * Latest run per slug for a locale (highest id wins ties within a second).
 * Available for a future `translate:report`; the committed projection is what
 * the live pipeline and blog rely on.
 */
export function latestBySlug(
  db: Database,
  locale: string = DEFAULT_LOCALE
): TranslationRun[] {
  const rows = db
    .query(
      `SELECT t.* FROM translation_run t
         JOIN (SELECT slug, MAX(id) AS mid FROM translation_run
                 WHERE locale = ? GROUP BY slug) m
           ON t.id = m.mid
        ORDER BY t.slug`
    )
    .all(locale) as RunRow[];
  return rows.map(toRun);
}
