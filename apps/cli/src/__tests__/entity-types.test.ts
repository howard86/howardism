import { describe, expect, it } from "bun:test";

import {
  buildEntityTypeMembership,
  isEntityNote,
  resolveEntityType,
} from "../import-wiki/entity-types.ts";
import type { ParsedWikiFile } from "../import-wiki/parse.ts";

const UNKNOWN_HEADING_ERROR = /Nonsense/;
const UNKNOWN_KIND_ERROR = /nonsense-kind/;

function moc(body: string): ParsedWikiFile {
  return {
    source: {
      slug: "moc-entities",
      folder: "concepts",
      absolutePath: "/tmp/moc-entities.md",
    },
    frontmatter: {},
    body,
    mtime: new Date("2026-01-01"),
  };
}

describe("buildEntityTypeMembership", () => {
  it("maps each section's members to the section's entity type", () => {
    const membership = buildEntityTypeMembership([
      moc(
        "### People\n- [[andrej-karpathy]] — x\n\n### Models\n- [[claude-opus-4-8]] — y\n"
      ),
    ]);
    expect(membership.get("andrej-karpathy")).toBe("person");
    expect(membership.get("claude-opus-4-8")).toBe("model");
  });

  it("returns an empty map when the vault has no moc-entities page", () => {
    expect(buildEntityTypeMembership([]).size).toBe(0);
  });

  it("throws when a section heading has no matching entity type", () => {
    // Silently skipping it would drop every entity the section lists into no
    // type — a corrupted grouping that still imports cleanly.
    expect(() =>
      buildEntityTypeMembership([moc("### Nonsense\n- [[blast-radius]]\n")])
    ).toThrow(UNKNOWN_HEADING_ERROR);
  });
});

describe("isEntityNote", () => {
  it("is true when frontmatter type is entity", () => {
    expect(isEntityNote("entity", false)).toBe(true);
  });

  it("is true when the legacy inline marker is present", () => {
    expect(isEntityNote(undefined, true)).toBe(true);
  });

  it("is false when neither signal is present", () => {
    expect(isEntityNote("derived", false)).toBe(false);
    expect(isEntityNote(undefined, false)).toBe(false);
  });
});

describe("resolveEntityType", () => {
  const membership = new Map([["andrej-karpathy", "person" as const]]);

  it("prefers a valid frontmatter kind over MOC membership", () => {
    expect(
      resolveEntityType("andrej-karpathy", membership, "organization")
    ).toBe("organization");
  });

  it("falls back to MOC membership when frontmatter kind is absent", () => {
    expect(resolveEntityType("andrej-karpathy", membership, undefined)).toBe(
      "person"
    );
  });

  it("returns undefined when neither frontmatter kind nor membership has it", () => {
    expect(
      resolveEntityType("unknown-slug", membership, undefined)
    ).toBeUndefined();
  });

  it("throws on an unrecognised frontmatter kind", () => {
    expect(() =>
      resolveEntityType("andrej-karpathy", membership, "nonsense-kind")
    ).toThrow(UNKNOWN_KIND_ERROR);
  });
});
