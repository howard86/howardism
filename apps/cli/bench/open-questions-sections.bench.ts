// A7: the open and the resolved question bullets are harvested by splitting
// every body twice, once per section.

import { collectQuestionSections } from "../src/import-wiki/pages/open-questions.ts";
import type { ParsedWikiFile } from "../src/import-wiki/parse.ts";
import { bench, checksum, log, readCorpus } from "./harness.ts";

const parsed: ParsedWikiFile[] = readCorpus().map((file) => ({
  body: file.text,
  frontmatter: {},
  isGenerated: false,
  mtime: new Date(0),
  source: { absolutePath: "", folder: "concepts", slug: file.slug },
}));

const sections = bench("collectQuestionSections over corpus", () =>
  collectQuestionSections(parsed)
);

log(
  `  files ${parsed.length}  open ${sections.open.size}  resolved ${sections.resolved.size}  checksum ${checksum([[...sections.open], [...sections.resolved]])}`
);
