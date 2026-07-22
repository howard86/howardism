import { describe, expect, it } from "bun:test";

import {
  buildDomainMembership,
  isMocSlug,
  mocSlugToDomain,
  resolveDomain,
} from "../import-wiki/domains.ts";
import type { ParsedWikiFile } from "../import-wiki/parse.ts";

const UNKNOWN_MOC_ERROR = /moc-agent-security/;

function moc(slug: string, body: string): ParsedWikiFile {
  return {
    source: { slug, folder: "concepts", absolutePath: `/tmp/${slug}.md` },
    frontmatter: {},
    body,
    mtime: new Date("2026-01-01"),
  };
}

describe("mocSlugToDomain", () => {
  it("maps a recognised MOC slug to its domain", () => {
    expect(mocSlugToDomain("moc-ai-engineering")).toBe("ai-engineering");
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
    moc(
      "moc-ai-engineering",
      "> Map of Content\n- [[agent-loop-pattern]] — x\n- [[hermes-agent]] — y\n"
    ),
    moc("moc-formal-math", "- [[ai-driven-formal-proof-search]] — z\n"),
  ];
  const membership = buildDomainMembership(parsed);

  it("assigns each listed concept to its MOC's domain", () => {
    expect(membership.get("agent-loop-pattern")).toBe("ai-engineering");
    expect(membership.get("ai-driven-formal-proof-search")).toBe("formal-math");
  });

  it("resolves a MOC page to its own domain", () => {
    expect(resolveDomain("moc-ai-engineering", membership)).toBe(
      "ai-engineering"
    );
  });

  it("falls back to syntheses for concepts in no MOC", () => {
    expect(resolveDomain("orphan-concept", membership)).toBe("syntheses");
  });

  it("throws when the vault holds a MOC with no matching domain", () => {
    // Silently skipping it would file every concept the MOC lists under
    // `syntheses` — a corrupted browse axis that still imports cleanly.
    expect(() =>
      buildDomainMembership([moc("moc-agent-security", "- [[blast-radius]]\n")])
    ).toThrow(UNKNOWN_MOC_ERROR);
  });
});
