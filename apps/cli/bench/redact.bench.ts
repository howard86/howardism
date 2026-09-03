// A2: redactLocalPaths runs 11 vault-path regexes over every body, though
// only a handful of bodies mention the vault at all.
import { redactLocalPaths } from "../src/import-wiki/transform.ts";
import { bench, checksum, log, readCorpus } from "./harness.ts";

const corpus = readCorpus();
const MARKERS = ["obsidian-vault", "raw/assets", "wiki/"];
const withMarker = corpus.filter((file) =>
  MARKERS.some((marker) => file.text.includes(marker))
).length;

const redacted = bench("redactLocalPaths over corpus", () => {
  const out: string[] = [];
  for (const file of corpus) {
    out.push(redactLocalPaths(file.text));
  }
  return out;
});

log(
  `  files ${corpus.length}  with a vault marker ${withMarker}  checksum ${checksum(redacted.join("\n"))}`
);
