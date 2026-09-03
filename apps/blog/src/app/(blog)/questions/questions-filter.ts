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
  slug: string;
  title: string;
}

/** Flatten every concept into a searchable stanza. Runs once per corpus. */
export function buildStanzas(concepts: OpenQuestionConcept[]): Stanza[] {
  return concepts.map((concept) => ({
    domain: concept.domain,
    haystack: concept.title.toLowerCase(),
    lines: linesOf(concept),
    slug: concept.slug,
    title: concept.title,
  }));
}

/**
 * Narrow to the stanzas a domain and a set of search tokens leave standing. A
 * line matches only when its concept title or its own text holds every token.
 */
export function filterStanzas(
  stanzas: readonly Stanza[],
  tokens: readonly string[],
  domain: WikiDomain | null
): Stanza[] {
  return stanzas
    .filter((stanza) => domain === null || stanza.domain === domain)
    .map((stanza) => ({
      ...stanza,
      lines: stanza.lines.filter((line) =>
        tokens.every(
          (token) =>
            stanza.haystack.includes(token) ||
            line.text.toLowerCase().includes(token)
        )
      ),
    }))
    .filter((stanza) => stanza.lines.length > 0);
}

/** Keep only the lines in one triage bucket; `null` keeps every line. */
export function applyBucket(
  scoped: readonly Stanza[],
  bucket: TriageBucket | null
): Stanza[] {
  return scoped
    .map((stanza) => ({
      ...stanza,
      lines:
        bucket === null
          ? stanza.lines
          : stanza.lines.filter((line) => line.bucket === bucket),
    }))
    .filter((stanza) => stanza.lines.length > 0);
}
