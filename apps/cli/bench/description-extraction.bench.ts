// C9: firstBlockquote and firstParagraph both stopped within the first handful
// of an article's lines but split the whole body to get there. An article body
// averages 129 lines, so that was an array and a string per line nobody read.
import matter from "gray-matter";

import {
  firstBlockquote,
  firstParagraph,
} from "../src/import-wiki/transform.ts";
import { bench, checksum, log, readCorpus } from "./harness.ts";

const bodies = readCorpus().map((file) => matter(file.text, {}).content);
const lines = bodies.reduce(
  (total, body) => total + body.split("\n").length,
  0
);
log(`  bodies ${bodies.length}  lines ${lines}`);

const quotes = bench("firstBlockquote x corpus", () =>
  bodies.map((body) => firstBlockquote(body))
);
log(`  checksum ${checksum(quotes)}`);

const paragraphs = bench("firstParagraph x corpus", () =>
  bodies.map((body) => firstParagraph(body))
);
log(`  checksum ${checksum(paragraphs)}`);
