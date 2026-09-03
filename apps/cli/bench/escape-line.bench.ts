// A1: escapeMdxBody walks every character of every prose line, even though
// only ~7% of lines contain one of the four characters MDX cares about.
import { escapeMdxBody } from "../src/import-wiki/transform.ts";
import { bench, checksum, log, readCorpus } from "./harness.ts";

const corpus = readCorpus();

const escaped = bench("escapeMdxBody over corpus", () => {
  const out: string[] = [];
  for (const file of corpus) {
    out.push(escapeMdxBody(file.text));
  }
  return out;
});

log(`  files ${corpus.length}  checksum ${checksum(escaped.join("\n"))}`);
