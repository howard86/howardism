import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import matter from "gray-matter";

import type { GlossaryEntry } from "./store.ts";

export interface HarvestCandidate {
  category: string;
  slugs: string[];
  term: string;
}

export interface HarvestDoc {
  slug: string;
  text: string;
}

export interface HarvestOptions {
  articlesDir: string;
  slugs?: string[];
}

const MDX_SUFFIX_RE = /\.mdx$/;
const CODE_FENCE_RE = /```[\s\S]*?```/g;
const HERO_IMAGE_LINE_RE = /^export\s*\{[^}]*\bheroImage\b[^}]*\}[^\n]*$/gm;
// Blank out leading list/blockquote markers so they never read as part of a
// word. Headings are handled separately (see HEADING_FULL_LINE_RE) — their
// entire line is dropped, not just the marker.
const MARKDOWN_LINE_PREFIX_RE = /^([-*+]\s+|\d+\.\s+|>\s*)/gm;
const HEADING_LINE_RE = /^#{1,6}\s+(.*)$/;
// Any markdown heading line, dropped in full. Title Case headings ("##
// Recommended Error Categories", "## Models Improve") are the main generator
// of fake multi-word phrases — real proper-noun phrases occur in body prose,
// not heading text, so this loses no genuine signal.
const HEADING_FULL_LINE_RE = /^#{1,6}\s+.*$/gm;
// Headings that introduce a bullet list of hyperlinked article/citation
// titles (external sources, or this article's own backlink/related graph) —
// not the article's own prose.
const LINK_LIST_HEADING_RE = /^(sources|connections|related|derived)$/i;

/**
 * Blank out link-list sections (heading through the next heading, or end of
 * text): `## Sources`, `## Connections`, `## Related`, `## Derived`. Their
 * arbitrary Title Case (external citation titles, or other articles' titles
 * from the backlink graph) pollutes candidate extraction — e.g. a citation
 * called "A Field Guide to Fable" yields the junk phrase "A Field Guide".
 * Replaces each blanked line with spaces of the same length so character
 * offsets elsewhere are unaffected.
 */
function blankLinkListSections(text: string): string {
  const lines = text.split("\n");
  let inLinkList = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] as string;
    const headingMatch = HEADING_LINE_RE.exec(line);
    if (headingMatch) {
      inLinkList = LINK_LIST_HEADING_RE.test(
        (headingMatch[1] as string).trim()
      );
    }
    if (inLinkList) {
      lines[i] = " ".repeat(line.length);
    }
  }
  return lines.join("\n");
}

// A bare URL (e.g. inside a markdown link's `(...)` target) — its path can
// contain arbitrary mixed-case IDs (a YouTube video ID, a hash) that read as
// CamelCase but aren't words at all.
const URL_RE = /https?:\/\/\S+/g;

/**
 * Clean a raw MDX file's content down to prose: strip YAML frontmatter (via
 * gray-matter), link-list sections (Sources/Connections/Related/Derived),
 * fenced code blocks, the `heroImage` export line, URLs, whole heading
 * lines, and leading list/blockquote markers. Pure — no IO.
 */
export function extractBody(raw: string): string {
  const { content } = matter(raw);
  return blankLinkListSections(content)
    .replace(CODE_FENCE_RE, " ")
    .replace(HERO_IMAGE_LINE_RE, " ")
    .replace(URL_RE, (m) => " ".repeat(m.length))
    .replace(HEADING_FULL_LINE_RE, (m) => " ".repeat(m.length))
    .replace(MARKDOWN_LINE_PREFIX_RE, (m) => " ".repeat(m.length));
}

interface Span {
  end: number;
  start: number;
}

const overlapsAny = (span: Span, spans: Span[]): boolean =>
  spans.some((s) => span.start < s.end && span.end > s.start);

/**
 * Collect non-overlapping matches of `re` against `text`, skipping any span
 * that overlaps one already in `consumed` (mutated in place with newly
 * accepted spans) so a later, lower-priority pattern can't re-split a match
 * already claimed by a higher-priority one — e.g. "Brown" inside the phrase
 * match "Noam Brown".
 */
function collectNonOverlapping(
  text: string,
  re: RegExp,
  consumed: Span[],
  filter?: (match: string) => boolean
): string[] {
  const out: string[] = [];
  re.lastIndex = 0;
  let m = re.exec(text);
  while (m) {
    const span: Span = { start: m.index, end: m.index + m[0].length };
    if (!overlapsAny(span, consumed) && (!filter || filter(m[0]))) {
      out.push(m[0]);
      consumed.push(span);
    }
    m = re.exec(text);
  }
  return out;
}

// RFC-2119 spec keywords: always-caps, but shouting emphasis ("Deployments
// MUST ...") rather than a genuine acronym or proper-noun phrase word.
// Rejected from both the acronym rule and phrase matching (see
// isValidPhrase below).
const RFC2119_KEYWORDS = new Set([
  "must",
  "should",
  "shall",
  "may",
  "not",
  "required",
  "optional",
  "recommended",
]);

// 3-8 chars, all caps, digits/hyphens allowed (RLHF, GPT-5, INF). A 2-char
// floor let through too many ambiguous fragments (Roman numerals "II"/"IV",
// interjections "OK") relative to genuine acronyms — precision over recall.
const ACRONYM_RE = /\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*\b/g;
const MIN_ACRONYM_LEN = 3;
const MAX_ACRONYM_LEN = 8;
const isValidAcronym = (m: string): boolean =>
  m.length >= MIN_ACRONYM_LEN &&
  m.length <= MAX_ACRONYM_LEN &&
  !RFC2119_KEYWORDS.has(m.toLowerCase());

// CamelCase / mixed-case product tokens (DeepMind, TypeScript, OpenAI): two
// or more capital-initiated segments glued together.
const CAMEL_RE = /\b[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+\b/g;

// 2+ consecutive Capitalized words (Constitutional AI, Noam Brown, and —
// via the internal hyphen — Alignment Fine-Tuning). Each word must be 2+
// chars so a sentence-initial "A"/"I" doesn't glue onto the real term that
// follows it ("A Jacobian" -> just "Jacobian"). The separator is same-line
// whitespace only ([ \t], not \s) so a heading/paragraph break (blank line)
// never glues its last word onto the next line's first word.
const PHRASE_RE = /\b[A-Z][A-Za-z0-9-]+(?:[ \t]+[A-Z][A-Za-z0-9-]+)+\b/g;

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

// Function words (articles/pronouns/prepositions/conjunctions/auxiliary
// verbs) that can start a phrase match purely by grammar, not because the
// phrase is a proper noun ("The Open", "For UI", "Her May", "Is GRPO").
// Rejecting these as a phrase's FIRST word is safe because a genuine
// proper-noun phrase never opens on a function word.
const LEADING_FUNCTION_WORDS = new Set([
  "the",
  "a",
  "an",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "this",
  "that",
  "these",
  "those",
  "his",
  "her",
  "its",
  "our",
  "your",
  "their",
  "who",
  "whom",
  "whose",
  "which",
  "what",
  "where",
  "when",
  "why",
  "how",
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "about",
  "against",
  "between",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "to",
  "from",
  "up",
  "down",
  "over",
  "under",
  "within",
  "of",
  "off",
  "out",
  "since",
  "as",
  "and",
  "but",
  "or",
  "nor",
  "so",
  "yet",
  "because",
  "although",
  "though",
  "while",
  "if",
  "unless",
  "until",
  "not",
  "no",
  "plus",
  // Spelled-out cardinal numbers — deliberately EXCLUDING "zero" (Zero
  // Trust, Zero OKR are real terms in this corpus that open on it).
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  // Sentence-level adverbs/connectors/participles: a genuine proper-noun
  // phrase never opens on one either ("Once Claude", "Previously Anthropic",
  // "Recommended Error Categories" are all sentence/heading fragments).
  "once",
  "previously",
  "recommended",
  "however",
  "therefore",
  "additionally",
  "meanwhile",
  "finally",
  "specifically",
  "notably",
  "importantly",
  "essentially",
  "furthermore",
  "moreover",
  "instead",
  "otherwise",
  "similarly",
  "likewise",
  "consequently",
  "accordingly",
  "now",
  "today",
  "recently",
  "currently",
  "typically",
  "generally",
  "usually",
  "often",
  "rarely",
  "always",
  "never",
  "later",
  "earlier",
  "soon",
  "eventually",
  "certainly",
  "clearly",
  "obviously",
  "surprisingly",
  "unfortunately",
  "fortunately",
  "actually",
  "basically",
  "literally",
  "given",
  "unlike",
  "besides",
  "regarding",
  "concerning",
  "including",
  "excluding",
  // Structural section/document references ("Part II", "Remark III").
  "part",
  "section",
  "chapter",
  "remark",
  "figure",
  "table",
  "appendix",
  "theorem",
  "lemma",
  "corollary",
  // Auxiliary/copula verbs: closed-class, so a genuine proper-noun phrase
  // never opens on one either ("Is GRPO" is a body-prose rhetorical
  // question, not a term). Deliberately NOT extending this to open-class
  // descriptive verbs/nouns ("Hit", "Median") — those are enumerable only
  // by whack-a-mole, which is out of scope here.
  "is",
  "are",
  "was",
  "were",
  "has",
  "have",
  "had",
  "does",
  "did",
  "do",
  "will",
  "would",
  "can",
  "could",
  "should",
]);

const PHRASE_WORD_RE = /[ \t]+/;

/**
 * True unless `term` (a raw {@link PHRASE_RE} match) opens on a function
 * word ("The Open", "For UI") or contains a bare month name or RFC-2119
 * keyword ("Her May", "Released April", "Deployments MUST") — all read as
 * 2+ Capitalized words but aren't proper nouns.
 */
const isValidPhrase = (term: string): boolean => {
  const words = term.split(PHRASE_WORD_RE).map((w) => w.toLowerCase());
  if (LEADING_FUNCTION_WORDS.has(words[0] as string)) {
    return false;
  }
  return !words.some((w) => MONTH_NAMES.includes(w) || RFC2119_KEYWORDS.has(w));
};

/**
 * Extract candidate DNT terms from a set of already-cleaned (see
 * {@link extractBody}) article bodies. Precision over recall:
 * - acronyms -> category "tech"
 * - CamelCase / mixed-case tokens -> "product"
 * - multi-word Capitalized phrases -> "entity"
 * A single repeated Capitalized word is deliberately NOT its own rule — at
 * corpus scale almost any generic English word used as a bolded list-item
 * label ("**Review**:", "**Sales**:") clears a low repeat bar without being
 * a genuine proper noun; real single-word DNT terms are rare enough to add
 * manually. Pure function — no IO, no glossary lookups. Returned candidates
 * are sorted by term and carry every slug they were seen in.
 */
export function extractCandidates(docs: HarvestDoc[]): HarvestCandidate[] {
  const byKey = new Map<
    string,
    { category: string; slugs: Set<string>; term: string }
  >();
  const upsert = (term: string, category: string, slug: string): void => {
    const key = term.toLowerCase();
    const existing = byKey.get(key);
    if (existing) {
      existing.slugs.add(slug);
      return;
    }
    byKey.set(key, { term, category, slugs: new Set([slug]) });
  };

  for (const { slug, text } of docs) {
    const consumed: Span[] = [];
    for (const term of collectNonOverlapping(
      text,
      PHRASE_RE,
      consumed,
      isValidPhrase
    )) {
      upsert(term, "entity", slug);
    }
    for (const term of collectNonOverlapping(text, CAMEL_RE, consumed)) {
      upsert(term, "product", slug);
    }
    for (const term of collectNonOverlapping(
      text,
      ACRONYM_RE,
      consumed,
      isValidAcronym
    )) {
      upsert(term, "tech", slug);
    }
  }

  return [...byKey.values()]
    .map((v) => ({
      term: v.term,
      category: v.category,
      slugs: [...v.slugs].sort(),
    }))
    .sort((a, b) => a.term.localeCompare(b.term));
}

const WORD_CHAR_RE = /[a-z0-9]/i;
const isWordChar = (c: string | undefined): boolean =>
  !!c && WORD_CHAR_RE.test(c);

/**
 * True if `term` is a strict substring of some existing (longer) entry at a
 * word boundary on both sides — e.g. "Cherny" inside "Boris Cherny". Keeps
 * harvest from re-suggesting a fragment of an already-registered phrase.
 */
const isCoveredBySubstring = (
  term: string,
  existingLower: string[]
): boolean => {
  const lower = term.toLowerCase();
  return existingLower.some((existing) => {
    if (existing.length <= lower.length) {
      return false;
    }
    const idx = existing.indexOf(lower);
    if (idx < 0) {
      return false;
    }
    return !(
      isWordChar(existing[idx - 1]) || isWordChar(existing[idx + lower.length])
    );
  });
};

/**
 * Drop candidates already in the glossary (case-insensitive) or that are a
 * substring of an existing longer entry. Pure — takes `listTerms(db)`'s
 * output rather than a DB handle.
 */
export function filterAgainstGlossary(
  candidates: HarvestCandidate[],
  existing: GlossaryEntry[]
): HarvestCandidate[] {
  const existingLowerSet = new Set(existing.map((e) => e.term.toLowerCase()));
  const existingLowerList = [...existingLowerSet];
  return candidates.filter((c) => {
    const lower = c.term.toLowerCase();
    if (existingLowerSet.has(lower)) {
      return false;
    }
    return !isCoveredBySubstring(c.term, existingLowerList);
  });
}

/**
 * Read + clean the given slugs' (or, if omitted, every) `.mdx` article under
 * `articlesDir`. An explicitly-requested slug whose file is missing is
 * skipped with a stderr warning rather than failing the whole scan.
 */
export async function readArticleDocs(
  articlesDir: string,
  slugs?: string[]
): Promise<HarvestDoc[]> {
  let filenames: string[];
  if (slugs && slugs.length > 0) {
    filenames = slugs.map((slug) => `${slug}.mdx`);
  } else {
    try {
      filenames = (await readdir(articlesDir)).filter((f) =>
        MDX_SUFFIX_RE.test(f)
      );
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw err;
    }
  }

  const docs: HarvestDoc[] = [];
  for (const filename of filenames) {
    const slug = filename.replace(MDX_SUFFIX_RE, "");
    const filePath = join(articlesDir, filename);
    let raw: string;
    try {
      raw = await readFile(filePath, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        console.error(`harvest: skipping missing article "${slug}"`);
        continue;
      }
      throw err;
    }
    docs.push({ slug, text: extractBody(raw) });
  }
  return docs;
}

/**
 * Top-level orchestrator used by the CLI: scan the given (or all) articles,
 * extract candidate DNT terms, and filter out anything already covered by
 * `existing` (typically `listTerms(db)`).
 */
export async function harvestGlossaryCandidates(
  options: HarvestOptions,
  existing: GlossaryEntry[]
): Promise<{ candidates: HarvestCandidate[]; scannedSlugs: string[] }> {
  const docs = await readArticleDocs(options.articlesDir, options.slugs);
  const candidates = filterAgainstGlossary(extractCandidates(docs), existing);
  return { candidates, scannedSlugs: docs.map((d) => d.slug) };
}
