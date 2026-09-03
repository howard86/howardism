// A12: parseInline builds a fresh /g scanner on every call and once more per
// nested emphasis level, so one /questions mount allocates thousands.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseOpenQuestions } from "@howardism/article-contract/manifests/open-questions";
import { parseInline } from "@howardism/article-contract/markup";

import { bench, checksum, DATA_DIR, log } from "./harness";

const manifest = parseOpenQuestions(
  JSON.parse(readFileSync(join(DATA_DIR, "open-questions.json"), "utf8"))
);
const lines = manifest.byConcept.flatMap((concept) => [
  ...concept.questions.map((question) => question.text),
  ...concept.resolved,
]);

const parsed = bench("parseInline over every question line", () =>
  lines.map((line) => parseInline(line))
);

log(`  lines ${lines.length}  checksum ${checksum(parsed)}`);
