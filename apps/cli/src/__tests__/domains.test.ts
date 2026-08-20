import { describe, expect, it } from "bun:test";

import type { CatalogRow } from "../import-wiki/catalog.ts";
import {
  buildDomainMembership,
  isMocSlug,
  mocSlugToDomain,
  resolveDomain,
} from "../import-wiki/domains.ts";
import type { ParsedWikiFile } from "../import-wiki/parse.ts";

const UNKNOWN_MOC_ERROR = /moc-nonsense/;
const UNKNOWN_DOMAIN_ERROR = /nonsense-domain/;
const UNCATALOGED_ERROR = /orphan-concept/;

function page(
  slug: string,
  overrides: Partial<ParsedWikiFile> = {}
): ParsedWikiFile {
  return {
    source: { slug, folder: "concepts", absolutePath: `/tmp/${slug}.md` },
    frontmatter: {},
    body: "",
    mtime: new Date("2026-01-01"),
    isGenerated: false,
    ...overrides,
  };
}

function row(overrides: Partial<CatalogRow> = {}): CatalogRow {
  return { type: "concept", domain: "", title: "", summary: "", ...overrides };
}

describe("mocSlugToDomain", () => {
  it("maps a recognised MOC slug to its domain", () => {
    expect(mocSlugToDomain("moc-agent-systems")).toBe("agent-systems");
  });

  it("returns null for non-MOC or unknown-domain slugs", () => {
    expect(mocSlugToDomain("agent-loop-pattern")).toBeNull();
    expect(mocSlugToDomain("moc-nonsense")).toBeNull();
  });
});

describe("isMocSlug", () => {
  it("detects MOC slugs", () => {
    expect(isMocSlug("moc-entities")).toBe(true);
    expect(isMocSlug("entities")).toBe(false);
  });
});

describe("buildDomainMembership + resolveDomain", () => {
  const parsed = [
    page("moc-agent-systems"),
    page("moc-formal-math"),
    page("agent-loop-pattern"),
    page("hermes-agent"),
    page("ai-driven-formal-proof-search"),
    page("andrej-karpathy"),
    page("open-questions-backlog", { isGenerated: true }),
  ];
  const catalog = new Map<string, CatalogRow>([
    ["agent-loop-pattern", row({ domain: "agent-systems" })],
    ["hermes-agent", row({ domain: "agent-systems" })],
    ["ai-driven-formal-proof-search", row({ domain: "formal-math" })],
    ["andrej-karpathy", row({ type: "entity", domain: "person" })],
  ]);
  const membership = buildDomainMembership(parsed, catalog);

  it("assigns each cataloged page to its catalog domain", () => {
    expect(membership.get("agent-loop-pattern")).toBe("agent-systems");
    expect(membership.get("ai-driven-formal-proof-search")).toBe("formal-math");
  });

  it("folds an entity-typed catalog row into the entities domain", () => {
    expect(membership.get("andrej-karpathy")).toBe("entities");
  });

  it("resolves a MOC page to its own domain", () => {
    expect(resolveDomain("moc-agent-systems", membership)).toBe(
      "agent-systems"
    );
  });

  it("falls back to syntheses for a generated page (no catalog row expected)", () => {
    expect(resolveDomain("open-questions-backlog", membership)).toBe(
      "syntheses"
    );
  });

  it("falls back to syntheses for a slug with no membership entry", () => {
    expect(resolveDomain("unlisted-slug", membership)).toBe("syntheses");
  });

  it("throws when the vault holds a MOC with no matching domain", () => {
    // Silently skipping it would file every concept the MOC lists under
    // `syntheses` — a corrupted browse axis that still imports cleanly.
    expect(() =>
      buildDomainMembership([page("moc-nonsense")], new Map())
    ).toThrow(UNKNOWN_MOC_ERROR);
  });

  it("throws when a non-MOC, non-generated page has no catalog row", () => {
    expect(() =>
      buildDomainMembership([page("orphan-concept")], new Map())
    ).toThrow(UNCATALOGED_ERROR);
  });

  it("prefers a valid frontmatter domain over catalog membership", () => {
    expect(resolveDomain("agent-loop-pattern", membership, "formal-math")).toBe(
      "formal-math"
    );
  });

  it("falls back to catalog membership when frontmatter domain is absent", () => {
    expect(resolveDomain("agent-loop-pattern", membership, undefined)).toBe(
      "agent-systems"
    );
  });

  it("throws on an unrecognised frontmatter domain", () => {
    expect(() =>
      resolveDomain("agent-loop-pattern", membership, "nonsense-domain")
    ).toThrow(UNKNOWN_DOMAIN_ERROR);
  });
});
