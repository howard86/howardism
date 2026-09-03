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

interface TermTrieNode {
  children: Map<string, TermTrieNode>;
  /** Set to the term string when a term ends at this node. */
  term: string | null;
}

function buildTermTrie(terms: string[]): TermTrieNode {
  const root: TermTrieNode = { children: new Map(), term: null };
  for (const term of terms) {
    let node = root;
    // Code unit, not code point: findPresentTerms walks text[i] the same
    // way, so an astral character (e.g. an emoji) must be keyed as its two
    // surrogate halves on both sides or the walk never lines up.
    // biome-ignore lint/style/useForOf: for...of iterates by code point, which would split each astral character differently than the code-unit walk below
    for (let i = 0; i < term.length; i++) {
      const ch = term[i];
      let next = node.children.get(ch);
      if (!next) {
        next = { children: new Map(), term: null };
        node.children.set(ch, next);
      }
      node = next;
    }
    node.term = term;
  }
  return root;
}

/**
 * Every term in `trie` that appears verbatim anywhere in `text`, found with
 * one linear scan instead of one `.includes()` call per term: at each
 * position, walk the trie as far as `text` matches, recording every term
 * completed along the way. Walking rather than a single alternation regex
 * matters here — a non-overlapping regex match would let a longer term (e.g.
 * "agentic") shadow a shorter one it contains ("agent"), silently dropping a
 * term `.includes()` would still find.
 */
function findPresentTerms(text: string, trie: TermTrieNode): Set<string> {
  const present = new Set<string>();
  for (let start = 0; start < text.length; start++) {
    let node = trie;
    for (let i = start; i < text.length; i++) {
      const next = node.children.get(text[i]);
      if (!next) {
        break;
      }
      node = next;
      if (node.term !== null) {
        present.add(node.term);
      }
    }
  }
  return present;
}

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
  const sourceLinksByText = new Map<string, LinkOccurrence>();
  for (const link of sourceLinks) {
    if (!sourceLinksByText.has(link.text)) {
      sourceLinksByText.set(link.text, link);
    }
  }

  const seen = new Set<string>();
  const dedupedTerms: string[] = [];
  for (const term of terms) {
    const trimmed = term.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    dedupedTerms.push(trimmed);
  }
  const glossaryTrie = buildTermTrie(dedupedTerms);
  const presentInSource = findPresentTerms(sourceText, glossaryTrie);

  let outputLinks = extractMarkdownLinks(text);
  let presentInOutput = findPresentTerms(text, glossaryTrie);

  for (const trimmed of dedupedTerms) {
    // Only terms actually used in the source are in scope.
    if (!presentInSource.has(trimmed)) {
      continue;
    }
    // Already verbatim in the output — nothing to do.
    if (presentInOutput.has(trimmed)) {
      continue;
    }

    const sourceLink = sourceLinksByText.get(trimmed);
    const outputLinksForUrl = sourceLink
      ? outputLinks.filter((link) => link.url === sourceLink.url)
      : [];

    const candidate = outputLinksForUrl[0];
    if (
      sourceLink &&
      outputLinksForUrl.length === 1 &&
      candidate.text !== trimmed &&
      !isProtected(candidate.raw)
    ) {
      const repaired = `[${trimmed}](${sourceLink.url})`;
      text = text.replace(candidate.raw, repaired);
      applied += 1;
      outputLinks = extractMarkdownLinks(text);
      presentInOutput = findPresentTerms(text, glossaryTrie);
      continue;
    }

    missing.push(trimmed);
  }

  return { applied, missing, text };
}
