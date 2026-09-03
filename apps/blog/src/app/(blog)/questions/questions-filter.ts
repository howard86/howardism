import type { WikiDomain } from "@howardism/article-contract";

import { linesOf, type QuestionLine } from "../articles/open-questions-section";
import type { OpenQuestionConcept } from "../articles/service";
import type { TriageBucket } from "../articles/triage-meta";

/** A concept with its lines pre-flattened once, so filtering stays cheap. */
export interface Stanza {
  domain: WikiDomain;
  /** Lowercased title, searched alongside every line under it. */
  haystack: string;
  lines: QuestionLine[];
  /** `lines[i].text` lowercased, so a keystroke never re-lowercases the corpus. */
  lowers: string[];
  slug: string;
  title: string;
}

/** Flatten every concept into a searchable stanza. Runs once per corpus. */
export function buildStanzas(concepts: OpenQuestionConcept[]): Stanza[] {
  return concepts.map((concept) => {
    const lines = linesOf(concept);
    return {
      domain: concept.domain,
      haystack: concept.title.toLowerCase(),
      lines,
      lowers: lines.map((line) => line.text.toLowerCase()),
      slug: concept.slug,
      title: concept.title,
    };
  });
}

/**
 * Narrow to the stanzas a domain and a set of search tokens leave standing. A
 * line matches only when its concept title or its own text holds every token.
 *
 * A stanza whose lines all survive is passed through as the same object, so a
 * keystroke that widens the result set allocates nothing for it.
 */
export function filterStanzas(
  stanzas: readonly Stanza[],
  tokens: readonly string[],
  domain: WikiDomain | null
): Stanza[] {
  const kept: Stanza[] = [];
  for (const stanza of stanzas) {
    if (domain !== null && stanza.domain !== domain) {
      continue;
    }
    // A token the concept title carries matches every line under it, so only
    // the rest are worth looking for line by line.
    const unmatched = tokens.filter(
      (token) => !stanza.haystack.includes(token)
    );
    if (unmatched.length === 0) {
      kept.push(stanza);
      continue;
    }
    const lines: QuestionLine[] = [];
    const lowers: string[] = [];
    for (const [index, lower] of stanza.lowers.entries()) {
      if (unmatched.every((token) => lower.includes(token))) {
        lines.push(stanza.lines[index]);
        lowers.push(lower);
      }
    }
    if (lines.length === 0) {
      continue;
    }
    kept.push(
      lines.length === stanza.lines.length
        ? stanza
        : { ...stanza, lines, lowers }
    );
  }
  return kept;
}

/** Keep only the lines in one triage bucket; `null` keeps every line. */
export function applyBucket(
  scoped: Stanza[],
  bucket: TriageBucket | null
): Stanza[] {
  if (bucket === null) {
    return scoped;
  }
  const kept: Stanza[] = [];
  for (const stanza of scoped) {
    const lines: QuestionLine[] = [];
    const lowers: string[] = [];
    for (const [index, line] of stanza.lines.entries()) {
      if (line.bucket === bucket) {
        lines.push(line);
        lowers.push(stanza.lowers[index]);
      }
    }
    if (lines.length === 0) {
      continue;
    }
    kept.push(
      lines.length === stanza.lines.length
        ? stanza
        : { ...stanza, lines, lowers }
    );
  }
  return kept;
}
