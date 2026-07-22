import { describe, expect, it } from "bun:test";

import type { ReadingEntry } from "@/lib/reading-store";
import { buildShelfRows, type ShelfManifestEntry } from "@/lib/shelf-rows";

const manifest: ShelfManifestEntry[] = [
  {
    slug: "alpha",
    title: "Alpha",
    label: "AI Engineering",
    href: "/articles/alpha",
    archived: false,
    kindPrefix: "C",
    readingTime: 8,
    tags: [],
  },
  {
    slug: "beta",
    title: "Beta",
    label: "Essay",
    href: "/articles/beta",
    archived: false,
    kindPrefix: "C",
    readingTime: 8,
    tags: [],
  },
  {
    slug: "gamma",
    title: "Gamma",
    label: "Entities",
    href: "/articles/gamma",
    archived: true,
    kindPrefix: "C",
    readingTime: 8,
    tags: [],
  },
];

describe("buildShelfRows", () => {
  it("resolves visible articles into rows, preserving newest-first order", () => {
    const history: ReadingEntry[] = [
      { slug: "beta", pct: 0.4, lastReadAt: 200 },
      { slug: "alpha", pct: 0.9, lastReadAt: 100 },
    ];

    const rows = buildShelfRows(history, manifest);

    expect(rows.map((row) => row.slug)).toEqual(["beta", "alpha"]);
    expect(rows[0]).toMatchObject({
      kind: "resolved",
      title: "Beta",
      label: "Essay",
      href: "/articles/beta",
      pct: 0.4,
      lastReadAt: 200,
    });
  });

  it("classifies an archived article as archived, still carrying its link", () => {
    const rows = buildShelfRows(
      [{ slug: "gamma", pct: 0.5, lastReadAt: 300 }],
      manifest
    );

    expect(rows[0]).toMatchObject({
      kind: "archived",
      title: "Gamma",
      href: "/articles/gamma",
    });
  });

  it("classifies an unresolved slug as a deleted tombstone, not dropped", () => {
    const history: ReadingEntry[] = [
      { slug: "ghost", pct: 0.5, lastReadAt: 300 },
      { slug: "alpha", pct: 0.3, lastReadAt: 100 },
    ];

    const rows = buildShelfRows(history, manifest);

    expect(rows.map((row) => ({ slug: row.slug, kind: row.kind }))).toEqual([
      { slug: "ghost", kind: "deleted" },
      { slug: "alpha", kind: "resolved" },
    ]);
  });

  it("returns an empty array for empty history", () => {
    expect(buildShelfRows([], manifest)).toEqual([]);
  });
});
