// C6: surfaceHash(raw) parses the frontmatter itself, so every caller that had
// already parsed it — articles-meta.ts, content-check.ts — paid for the parse
// twice. surfaceHashFrom(parsed) takes the parse the caller is holding.
//
// The digests must be identical: sourceHash is committed, and translate:check
// compares it, so a drift here would mark every translation stale.
import {
  surfaceHash,
  surfaceHashFrom,
} from "@howardism/article-contract/surface";
import matter from "gray-matter";

import { bench, checksum, log, readCorpus } from "./harness.ts";

const corpus = readCorpus();

const twice = bench("matter + surfaceHash (parses twice)", () =>
  corpus.map((file) => {
    const parsed = matter(file.text, {});
    return `${String(parsed.data.title ?? "")}:${surfaceHash(file.text)}`;
  })
);

const once = bench("matter + surfaceHashFrom (parses once)", () =>
  corpus.map((file) => {
    const parsed = matter(file.text, {});
    return `${String(parsed.data.title ?? "")}:${surfaceHashFrom(parsed)}`;
  })
);

const drift = twice.filter((entry, i) => entry !== once[i]).length;
log(
  `  files ${corpus.length}  digest drift ${drift}  checksum ${checksum(once)}`
);
