import { listTerms, openDb } from "../src/glossary/store.ts";
import { GlossaryTermMatcher } from "../src/translate/enforce.ts";
import { buildStructuredTranslatePrompt } from "../src/translate/prompt.ts";
import { bench, log, readCorpus } from "./harness";

const DB_PATH = new URL("../.translate-glossary.db", import.meta.url).pathname;
const SAMPLE_COUNT = 16;
const db = openDb(DB_PATH);
const glossaryTerms = listTerms(db).map(({ term }) => term);
db.close();

const articles = readCorpus().slice(0, SAMPLE_COUNT);
if (articles.length !== SAMPLE_COUNT) {
  throw new Error(
    `Expected ${SAMPLE_COUNT} sample articles, found ${articles.length}`
  );
}

const matcher = new GlossaryTermMatcher(glossaryTerms);
const measure = (filtered: boolean) =>
  articles.map(({ slug, text }) => ({
    bytes: Buffer.byteLength(
      buildStructuredTranslatePrompt({
        glossaryTerms: filtered ? matcher.find(text) : glossaryTerms,
        sourceText: text,
        targetLang: "zh-TW",
      }),
      "utf8"
    ),
    slug,
    termCount: filtered ? matcher.find(text).length : glossaryTerms.length,
  }));

const before = bench("all-glossary prompt bytes", () => measure(false));
const after = bench("source-matched prompt bytes", () => measure(true));
const totalBefore = before.reduce((sum, article) => sum + article.bytes, 0);
const totalAfter = after.reduce((sum, article) => sum + article.bytes, 0);
const saved = totalBefore - totalAfter;
log(`articles: ${articles.length}; glossary terms: ${glossaryTerms.length}`);
log(
  `all terms: ${totalBefore} bytes total, ${Math.round(totalBefore / articles.length)} mean`
);
log(
  `matched terms: ${totalAfter} bytes total, ${Math.round(totalAfter / articles.length)} mean`
);
log(`saved: ${saved} bytes (${((saved / totalBefore) * 100).toFixed(1)}%)`);
log(
  `mean matched glossary terms: ${Math.round(after.reduce((sum, article) => sum + article.termCount, 0) / articles.length)}`
);
