import {
  extractDisplayMath,
  extractFencedCodeBlocks,
  extractInlineCodeSpans,
  extractInlineMath,
} from "./validate.ts";

// `[text](url)` pairs, capturing both — reuses the same one-level-of-nested-
// parens allowance as validate.ts's link extractors (real corpus URLs
// contain literal `(1)`).
const MARKDOWN_LINK_RE = /\[([^\]]*)\]\(((?:[^()\s]|\([^()]*\))+)\)/g;

export interface EnforceResult {
  applied: number;
  missing: string[];
  text: string;
}

interface LinkOccurrence {
  raw: string;
  text: string;
  url: string;
}

const extractMarkdownLinks = (text: string): LinkOccurrence[] =>
  [...text.matchAll(MARKDOWN_LINK_RE)].map((m) => ({
    raw: m[0],
    text: m[1],
    url: m[2],
  }));

/**
 * Deterministic glossary enforcement: verify every do-not-translate term
 * that appears in the SOURCE also appears in the OUTPUT, and repair the one
 * case that is unambiguous and safe to fix automatically — a markdown link
 * whose SOURCE anchor text is exactly the term, and whose URL survives in
 * the output (uniquely — i.e. that URL isn't linked more than once) but
 * with different anchor text. That's a single well-defined string swap
 * keyed by an exact URL match, not a guess.
 *
 * ponytail: this is the ceiling. A term mistranslated or dropped mid-
 * sentence, or transliterated into the output script, cannot be repaired
 * without fuzzy find-and-replace across the document — which risks
 * corrupting unrelated prose the term happens to resemble. We don't attempt
 * that. Everything outside the narrow link-anchor case surfaces via
 * `missing` for the orchestrator to act on (re-run the engine, flag for
 * review) rather than being silently "fixed" by a guess.
 */
export function enforceGlossary(
  outputText: string,
  sourceText: string,
  terms: string[]
): EnforceResult {
  let text = outputText;
  const missing: string[] = [];
  let applied = 0;

  // Content that must never be touched by a repair — computed once, up
  // front, from the untouched output.
  const protectedSpans = [
    ...extractFencedCodeBlocks(outputText),
    ...extractDisplayMath(outputText),
    ...extractInlineMath(outputText),
    ...extractInlineCodeSpans(outputText),
  ];
  const isProtected = (raw: string): boolean =>
    protectedSpans.some((span) => span.includes(raw));

  const sourceLinks = extractMarkdownLinks(sourceText);
  const seen = new Set<string>();

  for (const term of terms) {
    const trimmed = term.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);

    // Only terms actually used in the source are in scope.
    if (!sourceText.includes(trimmed)) {
      continue;
    }
    // Already verbatim in the output — nothing to do.
    if (text.includes(trimmed)) {
      continue;
    }

    const sourceLink = sourceLinks.find((link) => link.text === trimmed);
    const outputLinksForUrl = sourceLink
      ? [...text.matchAll(MARKDOWN_LINK_RE)].filter(
          (m) => m[2] === sourceLink.url
        )
      : [];

    const candidate = outputLinksForUrl[0];
    if (
      sourceLink &&
      outputLinksForUrl.length === 1 &&
      candidate[1] !== trimmed &&
      !isProtected(candidate[0])
    ) {
      const repaired = `[${trimmed}](${sourceLink.url})`;
      text = text.replace(candidate[0], repaired);
      applied += 1;
      continue;
    }

    missing.push(trimmed);
  }

  return { applied, missing, text };
}
