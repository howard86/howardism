// A10: the /questions search re-lowercases 530 KB of question text on every
// keystroke and rebuilds every stanza whether or not it changed.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseOpenQuestions } from "@howardism/article-contract/manifests/open-questions";

import {
  buildStanzas,
  filterStanzas,
} from "../src/app/(blog)/questions/questions-filter";
import { bench, checksum, DATA_DIR, log } from "./harness";

const QUERIES = [["model"], ["ag", "en"], ["zzzz"]];

const manifest = parseOpenQuestions(
  JSON.parse(readFileSync(join(DATA_DIR, "open-questions.json"), "utf8"))
);
const stanzas = buildStanzas(manifest.byConcept);
const lines = stanzas.reduce((sum, stanza) => sum + stanza.lines.length, 0);
log(`  concepts ${stanzas.length}  lines ${lines}`);

for (const tokens of QUERIES) {
  const kept = bench(`filterStanzas [${tokens.join(" ")}]`, () =>
    filterStanzas(stanzas, tokens, null)
  );
  log(
    `  stanzas ${kept.length}  checksum ${checksum(kept.map((stanza) => [stanza.slug, stanza.lines.map((line) => line.text)]))}`
  );
}
