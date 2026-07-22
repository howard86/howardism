/**
 * Entity-type resolution for the wiki's Entity-tagged articles.
 *
 * `moc-entities.md` groups its members under `### <Heading>` sections —
 * People, Organizations, Software, Models, Documents — so the MOC body IS the
 * authoritative entity-type membership map, the same way `domains.ts` treats
 * `moc-*` bodies as the authoritative domain-membership map.
 *
 * The `@howardism/article-contract` package is the source of truth for the
 * `EntityType` union and `ENTITY_TYPES` array. This file owns only the
 * derivation logic that maps entity slugs → types.
 */
import type { EntityType } from "@howardism/article-contract";

import type { ParsedWikiFile } from "./parse.ts";
import { extractInternalSlugs } from "./wikilink.ts";

const ENTITIES_MOC_SLUG = "moc-entities";
const SECTION_HEADING_RE = /^###\s+(.+)$/gm;

/** `### <Heading>` text -> `EntityType`, sourced from `moc-entities.md`. */
const HEADING_TO_ENTITY_TYPE: Record<string, EntityType> = {
  People: "person",
  Organizations: "organization",
  Software: "software",
  Models: "model",
  Documents: "document",
};

interface MocSection {
  body: string;
  heading: string;
}

/** Split a MOC body into its `### <Heading>` sections, source order. */
function splitSections(body: string): MocSection[] {
  const matches = [...body.matchAll(SECTION_HEADING_RE)];
  return matches.map((match, i) => {
    const start = (match.index ?? 0) + match[0].length;
    const next = matches[i + 1];
    const end = next ? (next.index ?? body.length) : body.length;
    return { heading: match[1].trim(), body: body.slice(start, end) };
  });
}

/**
 * Build the slug -> entity-type map from `moc-entities.md`'s `### <Heading>`
 * sections. Returns an empty map when the vault has no `moc-entities` page.
 *
 * Throws when the MOC holds a `###` section whose heading isn't one of the
 * five known types. Same reasoning as `buildDomainMembership`'s guard: a
 * vault-side rename must fail loudly, not silently drop entities into no
 * type.
 */
export function buildEntityTypeMembership(
  parsed: readonly ParsedWikiFile[]
): Map<string, EntityType> {
  const membership = new Map<string, EntityType>();
  const mocFile = parsed.find((file) => file.source.slug === ENTITIES_MOC_SLUG);
  if (!mocFile) {
    return membership;
  }

  const unknownHeadings: string[] = [];
  for (const section of splitSections(mocFile.body)) {
    const entityType = HEADING_TO_ENTITY_TYPE[section.heading];
    if (!entityType) {
      unknownHeadings.push(section.heading);
      continue;
    }
    for (const slug of extractInternalSlugs(section.body, { dedup: true })) {
      if (!membership.has(slug)) {
        membership.set(slug, entityType);
      }
    }
  }

  if (unknownHeadings.length > 0) {
    throw new Error(
      `${ENTITIES_MOC_SLUG}.md has section(s) with no matching entity type: ${unknownHeadings.sort().join(", ")}.\n` +
        "The vault's entity-type taxonomy has drifted from the code. For each " +
        "`### <Heading>` section, add it to:\n" +
        "  1. ENTITY_TYPES           packages/article-contract/src/index.ts\n" +
        "  2. HEADING_TO_ENTITY_TYPE apps/cli/src/import-wiki/entity-types.ts"
    );
  }

  return membership;
}
