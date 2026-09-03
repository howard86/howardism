// A8: residualEnglishRatio and countListItems build throwaway match arrays
// only to read `.length`. countListItems' regex stays here as the oracle;
// residualEnglishRatio's counters run over text this bench cannot see, so
// its equivalence is carried by the checksum.
import {
  countListItems,
  residualEnglishRatio,
} from "../src/translate/validate.ts";
import {
  bench,
  checksum,
  log,
  readCorpus,
  ZH_ARTICLES_DIR,
} from "./harness.ts";

const LIST_ITEM_RE = /^[ \t]*[-*+] /gm;

const corpus = readCorpus(ZH_ARTICLES_DIR);

const ratios = bench("residualEnglishRatio over zh-TW corpus", () =>
  corpus.map((file) => residualEnglishRatio(file.text))
);

const items = bench("countListItems over zh-TW corpus", () =>
  corpus.map((file) => countListItems(file.text))
);

let mismatches = 0;
for (const [index, file] of corpus.entries()) {
  if ((file.text.match(LIST_ITEM_RE) ?? []).length !== items[index]) {
    mismatches += 1;
    log(`  MISMATCH ${file.slug}`);
  }
}

log(
  `  files ${corpus.length}  list-item mismatches vs regex ${mismatches}  ratios ${checksum(ratios)}  items ${checksum(items)}`
);
