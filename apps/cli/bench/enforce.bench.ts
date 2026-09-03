// Benchmarks translate/enforce.ts's enforceGlossary (O2): a per-term
// includes()/matchAll() scan across the whole glossary vs. one alternation
// regex pass per document.
import { enforceGlossary } from "../src/translate/enforce";
import { bench, checksum, log, readCorpus, ZH_ARTICLES_DIR } from "./harness";

const WORD_RE = /[A-Za-z][A-Za-z-]{2,}/g;
const PHRASE_FRACTION = 0.1;
const GLOSSARY_SIZES = [500, 2000, 8000];
const BENCH_RUNS = 5;

/** Deterministic, sorted vocabulary drawn from the EN corpus. */
function corpusWordPool(texts: string[]): string[] {
  const words = new Set<string>();
  for (const text of texts) {
    for (const match of text.matchAll(WORD_RE)) {
      words.add(match[0]);
    }
  }
  return [...words].sort();
}

/** `size` terms from `pool`, ~10% of them two-word phrases. */
function buildGlossary(pool: string[], size: number): string[] {
  const phraseCount = Math.round(size * PHRASE_FRACTION);
  const wordCount = size - phraseCount;
  const terms = pool.slice(0, wordCount);
  const phraseStart = pool.length - phraseCount * 2;
  for (let i = 0; i < phraseCount; i++) {
    const a = pool[phraseStart + i * 2];
    const b = pool[phraseStart + i * 2 + 1];
    if (a && b) {
      terms.push(`${a} ${b}`);
    }
  }
  return terms;
}

const enFiles = readCorpus();
const zhBySlug = new Map(
  readCorpus(ZH_ARTICLES_DIR).map((f) => [f.slug, f.text])
);
const pairs = enFiles
  .filter((en) => zhBySlug.has(en.slug))
  .map((en) => ({
    slug: en.slug,
    source: en.text,
    output: zhBySlug.get(en.slug) as string,
  }));
log(`paired ${pairs.length} EN/zh-TW articles`);

const pool = corpusWordPool(pairs.map((p) => p.source));

for (const size of GLOSSARY_SIZES) {
  const terms = buildGlossary(pool, size);
  const results = bench(
    `enforceGlossary x${pairs.length} (glossary=${size})`,
    () => pairs.map((p) => enforceGlossary(p.output, p.source, terms)),
    BENCH_RUNS
  );
  log(
    `  checksum: ${checksum(
      results.map((r) => ({
        applied: r.applied,
        missing: r.missing,
        text: r.text,
      }))
    )}`
  );
}
