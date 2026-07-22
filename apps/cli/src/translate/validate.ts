import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";

import { ArticleContractSchema } from "@howardism/article-contract/schema";
import matter from "gray-matter";

const HERO_IMAGE_LINE_RE = /^export \{ default as heroImage \} from "[^"]+";$/m;
const MDX_SUFFIX_RE = /\.mdx$/;

// Fenced code block bodies (the content between the ```lang line and the
// closing ```), and inline `code` spans.
const FENCED_CODE_BLOCK_RE = /```[^\n]*\n([\s\S]*?)```/g;
const INLINE_CODE_RE = /`([^`\n]+)`/g;

// LaTeX math. Display ($$...$$) is matched first so its inner `$` pairs are
// never mistaken for inline math delimiters. Inline ($...$) follows the same
// delimiter rule pandoc uses to avoid false positives on prose dollar
// amounts ("$5-100M", "<$100"): the opening `$` must not be followed by
// whitespace, the closing `$` must not be preceded by whitespace, and the
// closing `$` must not be immediately followed by a digit (which is how
// "$1–5M | $233K | $316K" and similar table/prose runs stay unmatched).
const DISPLAY_MATH_RE = /\$\$[\s\S]*?\$\$/g;
const INLINE_MATH_RE = /\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\d)/g;

// Markdown link targets and bare URLs. Both allow one level of nested
// balanced parens inside the URL — real corpus URLs contain literal `(1)`
// (e.g. a CDN-escaped filename), which a naive "stop at the first `)`"
// regex truncates. Bare URLs additionally stop at CJK punctuation: zh-TW
// prose butts a URL directly against `。`/`，` with no space (unlike
// English), so without this the trailing punctuation gets swallowed into
// the "URL" and the source/output URLs no longer match byte-for-byte.
const MARKDOWN_LINK_TARGET_RE = /\]\(((?:[^()\s]|\([^()]*\))+)\)/g;
const BARE_URL_RE =
  /https?:\/\/(?:[^\s()\]。，、；：！？」』】》〉]|\([^\s()]*\))+/g;

const NON_WHITESPACE_RE = /\S/g;
const ASCII_LATIN_RE = /[A-Za-z]/g;
const LIST_ITEM_RE = /^[ \t]*[-*+] /gm;

/** Extract markdown link targets (`](...)`) plus bare `https?://` URLs. */
export function extractLinkUrls(text: string): string[] {
  const targets = [...text.matchAll(MARKDOWN_LINK_TARGET_RE)].map((m) => m[1]);
  const bare = text.match(BARE_URL_RE) ?? [];
  return [...targets, ...bare];
}

/** Extract fenced code block bodies, in document order. */
export function extractFencedCodeBlocks(text: string): string[] {
  return [...text.matchAll(FENCED_CODE_BLOCK_RE)].map((m) => m[1]);
}

/** Extract inline `code` spans (backticks included), skipping fenced blocks. */
export function extractInlineCodeSpans(text: string): string[] {
  const withoutFences = text.replace(FENCED_CODE_BLOCK_RE, "");
  return [...withoutFences.matchAll(INLINE_CODE_RE)].map((m) => m[0]);
}

/** Extract `$$...$$` display math spans (backticks included), in order. */
export function extractDisplayMath(text: string): string[] {
  return text.match(DISPLAY_MATH_RE) ?? [];
}

/** Extract `$...$` inline math spans, skipping display math, in order. */
export function extractInlineMath(text: string): string[] {
  const withoutDisplay = text.replace(DISPLAY_MATH_RE, "");
  return [...withoutDisplay.matchAll(INLINE_MATH_RE)].map((m) => m[0]);
}

interface SourceListEntry {
  title?: unknown;
}

/** Extract `sources[].title` values from parsed frontmatter, in order. */
export function extractSourceTitles(data: Record<string, unknown>): string[] {
  const sources = data.sources;
  if (!Array.isArray(sources)) {
    return [];
  }
  return sources.map((entry) => {
    const title = (entry as SourceListEntry | null)?.title;
    return typeof title === "string" ? title : "";
  });
}

interface MultisetDiff {
  added: string[];
  missing: string[];
}

const toMultiset = (items: string[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return counts;
};

/** Multiset (order-insensitive, count-sensitive) diff of two string lists. */
const diffMultisets = (source: string[], output: string[]): MultisetDiff => {
  const sourceCounts = toMultiset(source);
  const outputCounts = toMultiset(output);
  const missing: string[] = [];
  const added: string[] = [];
  for (const [item, count] of sourceCounts) {
    const outputCount = outputCounts.get(item) ?? 0;
    for (let i = outputCount; i < count; i += 1) {
      missing.push(item);
    }
  }
  for (const [item, count] of outputCounts) {
    const sourceCount = sourceCounts.get(item) ?? 0;
    for (let i = sourceCount; i < count; i += 1) {
      added.push(item);
    }
  }
  return { added, missing };
};

const MAX_ERROR_SNIPPET_LENGTH = 80;
const truncateForError = (value: string): string =>
  value.length > MAX_ERROR_SNIPPET_LENGTH
    ? `${value.slice(0, MAX_ERROR_SNIPPET_LENGTH)}…`
    : value;

/**
 * Ratio of ASCII-latin letters to non-whitespace characters in BODY PROSE
 * only — frontmatter, the heroImage line, code, math, and URLs are stripped
 * first since those legitimately stay English/ASCII. High values mean the
 * output is still mostly English, i.e. barely translated.
 *
 * Calibrated against all 157 committed zh-TW articles (script run against
 * the full corpus, not just a sample): observed range 0.204–0.778. This
 * corpus code-switches heavily — a well-translated technical article keeps
 * a lot of English nouns ("framing", "workflow", "role") inline, not just
 * glossary proper nouns — so the ceiling has to sit above 0.778. As a sanity
 * check, treating an UNTRANSLATED English source as if it were the output
 * scores ~0.85–0.90. The threshold sits between those two: comfortably above
 * every real translation, comfortably below an untranslated one.
 */
export const MAX_RESIDUAL_ENGLISH_RATIO = 0.85;

/**
 * Ratio of output body length to source body length (both post-frontmatter,
 * raw character counts). Catches truncated/summarised output. Traditional
 * Chinese is far more information-dense per character than English prose, so
 * a faithful translation is expected to be substantially SHORTER than its
 * source.
 *
 * Calibration surfaced a real, pre-existing issue: cross-checking `- `
 * bullet-list-item counts (Connections/Open-Questions sections) against
 * `lengthRatio` across the full 157-article corpus shows ~44 articles
 * (28%) have visibly fewer list items in the translation than the source —
 * i.e. genuine dropped content, not compression. Their lengthRatio spans
 * 0.184–0.588, badly overlapping with legitimately dense/compact
 * translations (whose observed floor is 0.393). No single threshold
 * separates the two sets cleanly. This constant is deliberately set low
 * (well under the 0.393 floor of confirmed-clean articles) so it only ever
 * catches the most severe, unambiguous cases (majority of the body missing)
 * and never flags a legitimately compact translation — see
 * translate-validate.test.ts for the corpus regression numbers.
 */
export const MIN_LENGTH_RATIO = 0.3;

/**
 * Residual-English ratio over body prose (frontmatter/code/math/URLs/hero
 * line stripped first — see {@link MAX_RESIDUAL_ENGLISH_RATIO}).
 */
export function residualEnglishRatio(body: string): number {
  let stripped = body;
  stripped = stripped.replace(HERO_IMAGE_LINE_RE, "");
  stripped = stripped.replace(FENCED_CODE_BLOCK_RE, "");
  stripped = stripped.replace(INLINE_CODE_RE, "");
  stripped = stripped.replace(DISPLAY_MATH_RE, "");
  stripped = stripped.replace(INLINE_MATH_RE, "");
  stripped = stripped.replace(MARKDOWN_LINK_TARGET_RE, "]");
  stripped = stripped.replace(BARE_URL_RE, "");

  const nonWhitespace = stripped.match(NON_WHITESPACE_RE) ?? [];
  if (nonWhitespace.length === 0) {
    return 0;
  }
  const asciiLatin = stripped.match(ASCII_LATIN_RE) ?? [];
  return asciiLatin.length / nonWhitespace.length;
}

/**
 * Fraction of the source's markdown list items that survive into the output.
 *
 * This is the check that actually catches dropped content. Silently truncating
 * a long bullet list (Connections, Open Questions, Sources) barely moves
 * {@link lengthRatio} — the prose around it dominates the character count — so
 * truncation hides under any length-based threshold. Counting list items sees
 * it directly.
 *
 * Calibrated against all 157 committed zh-TW pairs: only 59 (38%) preserve
 * every item, the median retains 0.944, and the worst keeps 15 of 40 (0.375).
 * A threshold of 0.9 flags 56 of them. It is set there rather than at 1.0
 * because a faithful translation may legitimately merge or reflow a couple of
 * nested bullets, but losing more than a tenth of them is dropped content.
 */
export const MIN_LIST_ITEM_RATIO = 0.9;

/** Count markdown list items (`-`/`*`/`+` bullets) in a body. */
export function countListItems(body: string): number {
  return (body.match(LIST_ITEM_RE) ?? []).length;
}

/** Output-to-source list-item retention (see {@link MIN_LIST_ITEM_RATIO}). */
export function listItemRatio(sourceBody: string, outputBody: string): number {
  const sourceItems = countListItems(sourceBody);
  if (sourceItems === 0) {
    return 1;
  }
  return countListItems(outputBody) / sourceItems;
}

/** Output-to-source body length ratio (see {@link MIN_LENGTH_RATIO}). */
export function lengthRatio(sourceBody: string, outputBody: string): number {
  if (sourceBody.length === 0) {
    return outputBody.length === 0 ? 1 : Number.POSITIVE_INFINITY;
  }
  return outputBody.length / sourceBody.length;
}

export interface ValidateTranslationArgs {
  outputAbsPath: string;
  sourceAbsPath: string;
}

export interface ValidationResult {
  errors: string[];
  ok: boolean;
}

const dateToIsoDay = (value: unknown): unknown => {
  if (value instanceof Date) {
    // Use the YYYY-MM-DD prefix; matches the unquoted YAML date format used
    // throughout the corpus.
    return value.toISOString().slice(0, 10);
  }
  return value;
};

interface NormalisedFrontmatter {
  data: Record<string, unknown>;
  imageAlt: unknown;
}

const normaliseFrontmatter = (
  data: Record<string, unknown>
): NormalisedFrontmatter => {
  const out: Record<string, unknown> = { ...data };
  if ("date" in out) {
    out.date = dateToIsoDay(out.date);
  }
  // imageAlt is blog-only — not part of the write-time contract — so we lift
  // it out before schema validation.
  const { imageAlt, ...rest } = out;
  return { data: rest, imageAlt };
};

const extractHeroImageLine = (text: string): string | null => {
  const match = text.match(HERO_IMAGE_LINE_RE);
  return match ? match[0] : null;
};

const slugFromPath = (path: string): string =>
  basename(path).replace(MDX_SUFFIX_RE, "");

interface PreservedKeys {
  date: unknown;
  domain: unknown;
  readingTime: unknown;
  tag: unknown;
}

const pickPreserved = (data: Record<string, unknown>): PreservedKeys => ({
  date: dateToIsoDay(data.date),
  readingTime: data.readingTime,
  tag: data.tag,
  domain: data.domain,
});

const equalScalar = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true;
  }
  // Both undefined or both null
  if (a == null && b == null) {
    return true;
  }
  return false;
};

const checkHeroImageLine = (
  sourceText: string,
  outputText: string
): string[] => {
  const errors: string[] = [];
  const sourceHero = extractHeroImageLine(sourceText);
  const outputHero = extractHeroImageLine(outputText);
  if (!sourceHero) {
    errors.push("Source is missing a heroImage export line");
  }
  if (!outputHero) {
    errors.push("Output is missing a heroImage export line");
  }
  if (sourceHero && outputHero && sourceHero !== outputHero) {
    errors.push(
      `heroImage line mismatch:\n  source: ${sourceHero}\n  output: ${outputHero}`
    );
  }
  return errors;
};

const checkPreservedFrontmatter = (
  sourceData: Record<string, unknown>,
  outputData: Record<string, unknown>
): string[] => {
  const errors: string[] = [];
  const sourcePreserved = pickPreserved(sourceData);
  const outputPreserved = pickPreserved(outputData);
  for (const key of ["date", "tag", "domain", "readingTime"] as const) {
    if (!equalScalar(sourcePreserved[key], outputPreserved[key])) {
      errors.push(
        `Frontmatter \`${key}\` changed: source=${JSON.stringify(
          sourcePreserved[key]
        )}, output=${JSON.stringify(outputPreserved[key])}`
      );
    }
  }
  return errors;
};

/**
 * Shared shape for the ordered, byte-identical invariants (fenced code
 * blocks, display math, inline math): same length, same content at every
 * index.
 */
const checkOrderedByteIdentical = (
  label: string,
  sourceItems: string[],
  outputItems: string[]
): string[] => {
  if (sourceItems.length !== outputItems.length) {
    return [
      `${label} count changed: source has ${sourceItems.length}, output has ${outputItems.length}`,
    ];
  }
  const errors: string[] = [];
  for (let i = 0; i < sourceItems.length; i += 1) {
    if (sourceItems[i] !== outputItems[i]) {
      errors.push(
        `${label} #${i + 1} changed:\n  source: ${truncateForError(sourceItems[i])}\n  output: ${truncateForError(outputItems[i])}`
      );
    }
  }
  return errors;
};

const checkLinkUrlsInvariant = (
  sourceText: string,
  outputText: string
): string[] => {
  const diff = diffMultisets(
    extractLinkUrls(sourceText),
    extractLinkUrls(outputText)
  );
  if (diff.missing.length === 0 && diff.added.length === 0) {
    return [];
  }
  return [
    `Link URLs changed: missing=${JSON.stringify(diff.missing)}, added=${JSON.stringify(diff.added)}`,
  ];
};

const checkInlineCodeInvariant = (
  sourceText: string,
  outputText: string
): string[] => {
  const diff = diffMultisets(
    extractInlineCodeSpans(sourceText),
    extractInlineCodeSpans(outputText)
  );
  if (diff.missing.length === 0 && diff.added.length === 0) {
    return [];
  }
  return [
    `Inline code spans changed: missing=${JSON.stringify(diff.missing)}, added=${JSON.stringify(diff.added)}`,
  ];
};

const checkSourceTitlesInvariant = (
  sourceData: Record<string, unknown>,
  outputData: Record<string, unknown>
): string[] => {
  const sourceTitles = extractSourceTitles(sourceData);
  const outputTitles = extractSourceTitles(outputData);
  if (sourceTitles.length !== outputTitles.length) {
    return [
      `\`sources\` length changed: source has ${sourceTitles.length}, output has ${outputTitles.length}`,
    ];
  }
  const errors: string[] = [];
  for (let i = 0; i < sourceTitles.length; i += 1) {
    if (sourceTitles[i] !== outputTitles[i]) {
      errors.push(
        `\`sources[${i}].title\` changed: source=${JSON.stringify(sourceTitles[i])}, output=${JSON.stringify(outputTitles[i])}`
      );
    }
  }
  return errors;
};

const checkTranslationQuality = (
  sourceBody: string,
  outputBody: string
): string[] => {
  const errors: string[] = [];
  const englishRatio = residualEnglishRatio(outputBody);
  if (englishRatio > MAX_RESIDUAL_ENGLISH_RATIO) {
    errors.push(
      `Output body is still mostly English (residual-English ratio ${englishRatio.toFixed(2)} > ${MAX_RESIDUAL_ENGLISH_RATIO}) — looks untranslated`
    );
  }
  const bodyLengthRatio = lengthRatio(sourceBody, outputBody);
  if (bodyLengthRatio < MIN_LENGTH_RATIO) {
    errors.push(
      `Output body is too short relative to source (length ratio ${bodyLengthRatio.toFixed(2)} < ${MIN_LENGTH_RATIO}) — looks truncated or summarised`
    );
  }
  // Named counts, not just a ratio: a retry prompt can act on "38 of 48".
  const itemRatio = listItemRatio(sourceBody, outputBody);
  if (itemRatio < MIN_LIST_ITEM_RATIO) {
    errors.push(
      `Output dropped list items (kept ${countListItems(outputBody)} of ${countListItems(sourceBody)}, ratio ${itemRatio.toFixed(2)} < ${MIN_LIST_ITEM_RATIO}) — every source bullet must appear in the translation`
    );
  }
  return errors;
};

/**
 * Post-write validation for translated MDX. Mirrors `assertValidPng` from
 * `import-wiki/codex.ts` but for text: collects every failure into `errors`
 * so the orchestrator can decide whether to retry without re-running the
 * engine for each individual check.
 */
export async function validateTranslation(
  args: ValidateTranslationArgs
): Promise<ValidationResult> {
  const { sourceAbsPath, outputAbsPath } = args;
  const errors: string[] = [];

  // 1. Output exists and is non-empty.
  let outputStat: Awaited<ReturnType<typeof stat>>;
  try {
    outputStat = await stat(outputAbsPath);
  } catch {
    return {
      ok: false,
      errors: [`Output file does not exist: ${outputAbsPath}`],
    };
  }
  if (outputStat.size === 0) {
    return { ok: false, errors: [`Output file is empty: ${outputAbsPath}`] };
  }

  const outputText = await readFile(outputAbsPath, "utf8");

  // 2. Starts with "---".
  if (!outputText.startsWith("---")) {
    errors.push(
      `Output does not start with "---" (frontmatter must be the very first bytes)`
    );
  }

  // 3. Frontmatter parses + passes the article contract schema.
  let outputData: Record<string, unknown> = {};
  let outputImageAlt: unknown;
  let outputBody: string | null = null;
  try {
    const parsed = matter(outputText);
    outputBody = parsed.content;
    const normalised = normaliseFrontmatter(
      parsed.data as Record<string, unknown>
    );
    outputData = normalised.data;
    outputImageAlt = normalised.imageAlt;
    const schemaResult = ArticleContractSchema.safeParse(outputData);
    if (!schemaResult.success) {
      errors.push(
        `Output frontmatter fails ArticleContractSchema: ${schemaResult.error.message}`
      );
    }
  } catch (err) {
    errors.push(
      `Failed to parse output frontmatter: ${(err as Error).message}`
    );
  }

  // 4. imageAlt is a non-empty string.
  if (typeof outputImageAlt !== "string" || outputImageAlt.trim() === "") {
    errors.push("Output frontmatter `imageAlt` must be a non-empty string");
  }

  // 5. heroImage line equals source's byte-for-byte.
  let sourceText: string;
  try {
    sourceText = await readFile(sourceAbsPath, "utf8");
  } catch (err) {
    errors.push(`Failed to read source: ${(err as Error).message}`);
    return { ok: errors.length === 0, errors };
  }
  errors.push(...checkHeroImageLine(sourceText, outputText));

  // 6. Preserved frontmatter keys (date, tag, topic, readingTime) match.
  // Guard the source parse: a malformed source must surface as a validation
  // error, not an uncaught throw that aborts the whole run.
  let sourceData: Record<string, unknown> | null = null;
  let sourceBody: string | null = null;
  try {
    const parsedSource = matter(sourceText);
    sourceData = parsedSource.data as Record<string, unknown>;
    sourceBody = parsedSource.content;
  } catch (err) {
    errors.push(
      `Failed to parse source frontmatter: ${(err as Error).message}`
    );
  }
  if (sourceData) {
    errors.push(...checkPreservedFrontmatter(sourceData, outputData));
  }

  // 7. Slug matches.
  const sourceSlug = slugFromPath(sourceAbsPath);
  const outputSlug = slugFromPath(outputAbsPath);
  if (sourceSlug !== outputSlug) {
    errors.push(
      `Output filename slug "${outputSlug}" does not match source slug "${sourceSlug}"`
    );
  }

  // 8. Link URLs (markdown targets + bare URLs) match as a multiset.
  errors.push(...checkLinkUrlsInvariant(sourceText, outputText));

  // 9. Fenced code blocks are byte-identical, in order.
  errors.push(
    ...checkOrderedByteIdentical(
      "Fenced code block",
      extractFencedCodeBlocks(sourceText),
      extractFencedCodeBlocks(outputText)
    )
  );

  // 10. Inline code spans match as a multiset.
  errors.push(...checkInlineCodeInvariant(sourceText, outputText));

  // 11. Display math ($$...$$) is byte-identical, in order.
  errors.push(
    ...checkOrderedByteIdentical(
      "Display math span",
      extractDisplayMath(sourceText),
      extractDisplayMath(outputText)
    )
  );

  // 12. Inline math ($...$) is byte-identical, in order.
  errors.push(
    ...checkOrderedByteIdentical(
      "Inline math span",
      extractInlineMath(sourceText),
      extractInlineMath(outputText)
    )
  );

  // 13. sources[].title values (frontmatter) are unchanged.
  if (sourceData) {
    errors.push(...checkSourceTitlesInvariant(sourceData, outputData));
  }

  // 14. Translation-quality heuristics: residual English + length ratio.
  if (sourceBody !== null && outputBody !== null) {
    errors.push(...checkTranslationQuality(sourceBody, outputBody));
  }

  return { ok: errors.length === 0, errors };
}
