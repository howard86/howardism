/**
 * Domain resolution for the blog's primary browse axis.
 *
 * The vault curates knowledge domains as `moc-*` Map-of-Content pages; each MOC
 * lists the concepts/entities it owns, so the MOC bodies ARE the authoritative
 * domain-membership map. `derived/` essays aren't filed under any MOC, so they
 * fall back to the `syntheses` domain.
 *
 * The `@howardism/article-contract` package is the source of truth for the
 * `WikiDomain` union and `WIKI_DOMAINS` array. This file owns only the
 * derivation logic that maps wiki notes → domains.
 */
import { WIKI_DOMAINS, type WikiDomain } from "@howardism/article-contract";

import type { ParsedWikiFile } from "./parse.ts";
import { extractInternalSlugs } from "./wikilink.ts";

const MOC_SLUG_PREFIX = "moc-";
/** The lone derived backlog page; harvested separately, not a domain member. */
export const OPEN_QUESTIONS_SLUG = "open-questions";
/** Catch-all domain for `derived/` essays the vault doesn't file under a MOC. */
const FALLBACK_DOMAIN: WikiDomain = "syntheses";

const DOMAIN_SET: ReadonlySet<string> = new Set(WIKI_DOMAINS);

/** A `moc-*` slug is an Index page, not editorial content. */
export function isMocSlug(slug: string): boolean {
  return slug.startsWith(MOC_SLUG_PREFIX);
}

/**
 * `moc-ai-engineering` → `ai-engineering`, but only when the stripped slug is a
 * recognised domain. Returns `null` for any `moc-*` page that doesn't map to a
 * domain in the contract (so a stray MOC can't invent a bucket).
 */
export function mocSlugToDomain(slug: string): WikiDomain | null {
  if (!isMocSlug(slug)) {
    return null;
  }
  const candidate = slug.slice(MOC_SLUG_PREFIX.length);
  return DOMAIN_SET.has(candidate) ? (candidate as WikiDomain) : null;
}

/**
 * Build the slug → domain map by reading each MOC page's member list. First
 * MOC to claim a slug wins (a concept should appear in exactly one MOC).
 *
 * Throws when the vault holds a `moc-*` page whose domain isn't in the
 * contract. Skipping it silently would drop every concept that MOC lists into
 * the `syntheses` fallback — a corrupted browse axis that still imports, still
 * type-checks, and still passes `content:check`.
 */
export function buildDomainMembership(
  parsed: readonly ParsedWikiFile[]
): Map<string, WikiDomain> {
  const membership = new Map<string, WikiDomain>();
  const unknownMocs: string[] = [];
  for (const file of parsed) {
    const slug = file.source.slug;
    const domain = mocSlugToDomain(slug);
    if (!domain) {
      if (isMocSlug(slug)) {
        unknownMocs.push(slug);
      }
      continue;
    }
    for (const memberSlug of extractInternalSlugs(file.body, { dedup: true })) {
      if (!membership.has(memberSlug)) {
        membership.set(memberSlug, domain);
      }
    }
  }
  if (unknownMocs.length > 0) {
    throw new Error(
      `Vault MOC page(s) with no matching domain: ${unknownMocs.sort().join(", ")}.\n` +
        "The vault's domain taxonomy has drifted from the code. For each " +
        "`moc-<slug>` page, add `<slug>` to:\n" +
        "  1. WIKI_DOMAINS   packages/article-contract/src/index.ts\n" +
        "  2. DOMAIN_META    apps/blog/src/app/(blog)/articles/domain-meta.ts\n" +
        "  3. --domain-<slug> (light + dark) packages/ui/src/styles/globals.css"
    );
  }
  return membership;
}

/**
 * Resolve a single note's domain. A MOC page belongs to its own domain; a
 * concept/entity inherits the domain of the MOC that lists it; everything else
 * (derived essays, unlisted concepts) falls back to `syntheses`.
 */
export function resolveDomain(
  slug: string,
  membership: ReadonlyMap<string, WikiDomain>
): WikiDomain {
  return mocSlugToDomain(slug) ?? membership.get(slug) ?? FALLBACK_DOMAIN;
}
