// A3: computeReadingTime materialises ~1.5M word substrings only to read
// `.length`. The old regex form stays here as the equivalence oracle.
import { computeReadingTime } from "../src/import-wiki/transform.ts";
import { bench, checksum, log, readCorpus } from "./harness.ts";

const WORD_RE = /\b\w+\b/g;
const WORDS_PER_MINUTE = 200;

const corpus = readCorpus();

const minutes = bench("computeReadingTime over corpus", () => {
  const out: number[] = [];
  for (const file of corpus) {
    out.push(computeReadingTime(file.text));
  }
  return out;
});

let mismatches = 0;
for (const [index, file] of corpus.entries()) {
  const words = file.text.match(WORD_RE)?.length ?? 0;
  if (Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)) !== minutes[index]) {
    mismatches += 1;
    log(`  MISMATCH ${file.slug}`);
  }
}

log(
  `  files ${corpus.length}  mismatches vs /\\b\\w+\\b/g ${mismatches}  checksum ${checksum(minutes)}`
);
