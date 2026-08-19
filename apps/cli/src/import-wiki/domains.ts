/**
 * Domain resolution for the blog's primary browse axis.
 *
 * `_system/catalog.tsv` (see `catalog.ts`) is the authoritative domain source
 * for every wiki page except `moc-*` pages (which own their domain directly —
 * `moc-agent-systems` IS the `agent-systems` domain) and `generated: true`
 * pages (vault navigation, not filed under any domain — they fall back to
 * `syntheses`).
 *
 * The `@howardism/article-contract` package is the source of truth for the
 * `WikiDomain` union and `WIKI_DOMAINS` array. This file owns only the
 * derivation logic that maps wiki notes → domains.
 */
import { WIKI_DOMAINS, type WikiDomain } from "@howardism/article-contract";

import type { CatalogRow } from "./catalog.ts";
import type { ParsedWikiFile } from "./parse.ts";

const MOC_SLUG_PREFIX = "moc-";
/** Catch-all domain for pages the catalog doesn't file under a real domain. */
const FALLBACK_DOMAIN: WikiDomain = "syntheses";

const DOMAIN_SET: ReadonlySet<string> = new Set(WIKI_DOMAINS);

/** A `moc-*` slug is an Index page, not editorial content. */
export function isMocSlug(slug: string): boolean {
  return slug.startsWith(MOC_SLUG_PREFIX);
}

/**
 * `moc-agent-systems` → `agent-systems`, but only when the stripped slug is a
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
 * Build the slug → domain map from the catalog: an entity-typed row folds
 * into the `entities` domain, every other row takes its `domain` column
 * verbatim. `moc-*` pages resolve their own domain directly in
 * `resolveDomain` (not entered here) and `generated: true` pages have no
 * catalog row by design (they fall back to `syntheses` via `resolveDomain`'s
 * default) — both are skipped.
 *
 * Throws when the vault holds a `moc-*` page whose domain isn't in the
 * contract, or a non-MOC, non-generated page the catalog doesn't cover.
 * Skipping either silently would file concepts under `syntheses` by
 * accident — a corrupted browse axis that still imports, still type-checks,
 * and still passes `content:check`.
 */
export function buildDomainMembership(
  parsed: readonly ParsedWikiFile[],
  catalog: ReadonlyMap<string, CatalogRow>
): Map<string, WikiDomain> {
  const membership = new Map<string, WikiDomain>();
  const unknownMocs: string[] = [];
  const uncataloged: string[] = [];

  for (const file of parsed) {
    const slug = file.source.slug;
    if (isMocSlug(slug)) {
      if (!mocSlugToDomain(slug)) {
        unknownMocs.push(slug);
      }
      continue;
    }
    if (file.isGenerated) {
      continue;
    }
    const row = catalog.get(slug);
    if (!row) {
      uncataloged.push(slug);
      continue;
    }
    const domain = row.type === "entity" ? "entities" : row.domain;
    if (!DOMAIN_SET.has(domain)) {
      throw new Error(
        `Catalog row for "${slug}" has domain "${domain}", which isn't a known domain.\n` +
          "The vault's domain taxonomy has drifted from the code. Add it to:\n" +
          "  1. WIKI_DOMAINS   packages/article-contract/src/index.ts\n" +
          "  2. DOMAIN_META    apps/blog/src/app/(blog)/articles/domain-meta.ts\n" +
          "  3. --domain-<slug> (light + dark) packages/ui/src/styles/globals.css"
      );
    }
    membership.set(slug, domain as WikiDomain);
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
  if (uncataloged.length > 0) {
    throw new Error(
      `Wiki file(s) missing from _system/catalog.tsv: ${uncataloged.sort().join(", ")}.\n` +
        "Re-run `_system/build.py` in the vault to regenerate the catalog."
    );
  }

  return membership;
}

/**
 * Resolve a single note's domain. A MOC page belongs to its own domain; a
 * valid frontmatter `domain:` wins next; otherwise a page inherits the
 * domain the catalog assigned it; everything else (a `generated: true` page,
 * or any slug the membership map doesn't cover) falls back to `syntheses`.
 *
 * Throws on an unrecognised `domain:` value — same reasoning as
 * `buildDomainMembership`'s `unknownMocs` guard.
 */
export function resolveDomain(
  slug: string,
  membership: ReadonlyMap<string, WikiDomain>,
  frontmatterDomain?: string
): WikiDomain {
  const mocDomain = mocSlugToDomain(slug);
  if (mocDomain) {
    return mocDomain;
  }
  if (frontmatterDomain) {
    if (!DOMAIN_SET.has(frontmatterDomain)) {
      throw new Error(
        `"${slug}" has domain: "${frontmatterDomain}", which isn't a known domain.\n` +
          "The vault's domain taxonomy has drifted from the code. Add it to:\n" +
          "  1. WIKI_DOMAINS   packages/article-contract/src/index.ts\n" +
          "  2. DOMAIN_META    apps/blog/src/app/(blog)/articles/domain-meta.ts\n" +
          "  3. --domain-<slug> (light + dark) packages/ui/src/styles/globals.css"
      );
    }
    return frontmatterDomain as WikiDomain;
  }
  return membership.get(slug) ?? FALLBACK_DOMAIN;
}
