/**
 * The skill tree's membership + hub flags come straight from the domain's MOC
 * note, which lists concepts as `- [Title](/articles/slug)` with central ones
 * tagged `*(hub)*`. Parsing it here means the generator never has to invent an
 * ordering — the curated MOC is the source of truth.
 */

export interface MocConcept {
  isHub: boolean;
  slug: string;
  title: string;
}

const CONCEPT_LINE_RE = /^-\s+\[([^\]]+)\]\(\/articles\/([a-z0-9-]+)\)(.*)$/;
const HUB_MARKER = "*(hub)*";

/** Parse a MOC body into its member concepts, in listed order. */
export function parseMocConcepts(body: string): MocConcept[] {
  const concepts: MocConcept[] = [];
  const seen = new Set<string>();
  for (const rawLine of body.split("\n")) {
    const match = rawLine.trim().match(CONCEPT_LINE_RE);
    if (!match) {
      continue;
    }
    const [, title, slug, rest] = match;
    // A MOC sometimes links itself or repeats a cross-reference — keep the first.
    if (slug.startsWith("moc-") || seen.has(slug)) {
      continue;
    }
    seen.add(slug);
    concepts.push({
      slug,
      title: title.trim(),
      isHub: rest.includes(HUB_MARKER),
    });
  }
  return concepts;
}
