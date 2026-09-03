// A9: candidate extraction rescans a growing consumed-span list per match,
// and the glossary filter compares every candidate against every term.
import {
  extractBody,
  extractCandidates,
  filterAgainstGlossary,
} from "../src/glossary/harvest.ts";
import type { GlossaryEntry } from "../src/glossary/store.ts";
import { bench, checksum, log, readCorpus } from "./harness.ts";

const CAPITALISED_RE = /[A-Z][A-Za-z0-9]+/g;
const GLOSSARY_SOURCE_FILES = 80;
const SINGLE_TERMS = 1600;
const PHRASE_TERMS = 400;
const PHRASE_STRIDE = 7;

const corpus = readCorpus();
const docs = corpus.map((file) => ({
  slug: file.slug,
  text: extractBody(file.text),
}));

const candidates = bench("extractCandidates over corpus", () =>
  extractCandidates(docs)
);

// A deterministic stand-in for a populated glossary: the corpus' own
// capitalised words, plus adjacent pairs as two-word phrases so the
// substring-coverage rule has something longer to match against.
const words = [
  ...new Set(
    corpus
      .slice(0, GLOSSARY_SOURCE_FILES)
      .flatMap((file) => file.text.match(CAPITALISED_RE) ?? [])
  ),
].sort();
const terms = words.slice(0, SINGLE_TERMS);
for (
  let i = 0;
  i + 1 < words.length && terms.length < SINGLE_TERMS + PHRASE_TERMS;
  i += PHRASE_STRIDE
) {
  terms.push(`${words[i]} ${words[i + 1]}`);
}
const glossary: GlossaryEntry[] = terms.map((term) => ({
  term,
  category: "tech",
}));

const kept = bench("filterAgainstGlossary over corpus candidates", () =>
  filterAgainstGlossary(candidates, glossary)
);

log(
  `  candidates ${candidates.length}  glossary ${glossary.length}  kept ${kept.length}`
);
log(
  `  candidates ${checksum(candidates)}  kept ${checksum(kept.map((c) => c.term))}`
);
