import { describe, expect, it } from "bun:test";

import { buildEntityTypeMembership } from "../import-wiki/entity-types.ts";
import type { ParsedWikiFile } from "../import-wiki/parse.ts";

const UNKNOWN_HEADING_ERROR = /Nonsense/;

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
