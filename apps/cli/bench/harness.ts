// Shared benchmark helpers. An identical copy lives in apps/blog/bench/harness.ts;
// keep the two in sync. Benches read the committed corpus and never write.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
export const ARTICLES_DIR = join(
  REPO_ROOT,
  "apps",
  "blog",
  "src",
  "content",
  "articles"
);
export const ZH_ARTICLES_DIR = join(
  REPO_ROOT,
  "apps",
  "blog",
  "src",
  "content",
  "articles-zh-TW"
);
export const DATA_DIR = join(REPO_ROOT, "apps", "blog", "src", "data");

export interface CorpusFile {
  slug: string;
  text: string;
}

/** Every committed MDX article in `dir`, sorted by slug. */
export function readCorpus(dir = ARTICLES_DIR): CorpusFile[] {
  const files: CorpusFile[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.endsWith(".mdx")) {
      files.push({
        slug: name.slice(0, -4),
        text: readFileSync(join(dir, name), "utf8"),
      });
    }
  }
  return files;
}

export function log(line: string): void {
  process.stdout.write(`${line}\n`);
}

function report(name: string, samples: number[]): void {
  const sorted = [...samples].sort((a, b) => a - b);
  const min = sorted[0] ?? 0;
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  log(
    `${name.padEnd(48)} min ${min.toFixed(2).padStart(9)} ms   median ${median.toFixed(2).padStart(9)} ms   n=${sorted.length}`
  );
}

/**
 * Run `fn` `runs` times and print min / median wall time. Returns the last
 * result so the caller can checksum it against the before/after run.
 */
export function bench<T>(name: string, fn: () => T, runs = 7): T {
  const samples: number[] = [];
  let last: T | undefined;
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    last = fn();
    samples.push(performance.now() - start);
  }
  report(name, samples);
  return last as T;
}

export async function benchAsync<T>(
  name: string,
  fn: () => Promise<T>,
  runs = 5
): Promise<T> {
  const samples: number[] = [];
  let last: T | undefined;
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    // Sequential on purpose: overlapping runs would share the clock.
    last = await fn();
    samples.push(performance.now() - start);
  }
  report(name, samples);
  return last as T;
}

/**
 * Stable digest of a value's JSON form, so a before/after pair can be checked
 * for identical output by eye. Not cryptographic.
 */
export function checksum(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  let hash = 7;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 4_294_967_291;
  }
  return hash.toString(16).padStart(8, "0");
}
