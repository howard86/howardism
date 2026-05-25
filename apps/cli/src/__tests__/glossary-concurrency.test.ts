import { describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { listTerms, openDb } from "../glossary/store.ts";

const HERE = dirname(new URL(import.meta.url).pathname);
const CLI_ROOT = resolve(HERE, "../../");
const GLOSSARY_CLI = resolve(CLI_ROOT, "src/glossary/cli.ts");
const PROCESS_COUNT = 8;
const TERMS_PER_PROCESS = 4;
const SENTINEL_TERM = "__concurrency-test-sentinel__";

interface BatchResult {
  exitCode: number | null;
  stderr: string;
  stdout: string;
}

const runAddManyChild = async (
  dbPath: string,
  entries: { category: string; term: string }[]
): Promise<BatchResult> => {
  const proc = Bun.spawn(
    ["bun", GLOSSARY_CLI, "add-many", JSON.stringify(entries)],
    {
      env: {
        ...process.env,
        GLOSSARY_DB_PATH: dbPath,
      },
      stdout: "pipe",
      stderr: "pipe",
    }
  );
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, exitCode };
};

describe("glossary concurrency (cross-process add-many under contention)", () => {
  it("survives N concurrent writers against one DB without SQLITE_BUSY", async () => {
    const root = await mkdtemp(join(tmpdir(), "glossary-concurrency-"));
    const dbPath = join(root, ".translate-glossary.db");

    try {
      // Pre-populate with a sentinel so each child sees a non-empty table and
      // ensureSeeded short-circuits — otherwise each subprocess would harvest
      // the corpus and pollute the assertion. We're stress-testing the writer
      // path here, not the seed path.
      {
        const seedDb = openDb(dbPath);
        try {
          seedDb
            .query(
              "INSERT INTO glossary_term (term, category, source) VALUES (?, ?, ?)"
            )
            .run(SENTINEL_TERM, "tech", "manual");
        } finally {
          seedDb.close();
        }
      }

      // Each child writes a disjoint set of terms to maximise the chance of
      // contention without contention-induced duplicates muddying the assertion.
      const batches: { category: string; term: string }[][] = [];
      for (let p = 0; p < PROCESS_COUNT; p += 1) {
        const batch: { category: string; term: string }[] = [];
        for (let t = 0; t < TERMS_PER_PROCESS; t += 1) {
          batch.push({ term: `Term-P${p}-T${t}`, category: "tech" });
        }
        batches.push(batch);
      }

      const results = await Promise.all(
        batches.map((batch) => runAddManyChild(dbPath, batch))
      );

      for (const [i, res] of results.entries()) {
        if (res.exitCode !== 0) {
          throw new Error(
            `child ${i} exited ${res.exitCode}\nstdout: ${res.stdout}\nstderr: ${res.stderr}`
          );
        }
      }

      // Every child should have reported a one-line JSON summary on stdout.
      // It's the contract `add-many` exposes to the engine.
      for (const res of results) {
        const trimmed = res.stdout.trim();
        const parsed = JSON.parse(trimmed) as {
          added: number;
          total: number;
        };
        expect(parsed.added).toBe(TERMS_PER_PROCESS);
        expect(typeof parsed.total).toBe("number");
      }

      const expected = [
        SENTINEL_TERM,
        ...batches.flat().map((e) => e.term),
      ].sort();
      const db = openDb(dbPath);
      try {
        const actual = listTerms(db)
          .map((e) => e.term)
          .sort();
        expect(actual).toEqual(expected);
      } finally {
        db.close();
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 60_000);
});
