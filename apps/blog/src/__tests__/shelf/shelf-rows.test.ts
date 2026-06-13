import { describe, expect, it } from "bun:test";

import type { ReadingEntry } from "@/lib/reading-store";
import { buildShelfRows, type ShelfManifestEntry } from "@/lib/shelf-rows";

const manifest: ShelfManifestEntry[] = [
  {
    slug: "alpha",
    title: "Alpha",
    label: "AI Engineering",
    href: "/articles/alpha",
  },
  { slug: "beta", title: "Beta", label: "Essay", href: "/articles/beta" },
];

describe("buildShelfRows", () => {
  it("resolves history into rows, preserving newest-first order", () => {
    const history: ReadingEntry[] = [
      { slug: "beta", pct: 0.4, lastReadAt: 200 },
      { slug: "alpha", pct: 0.9, lastReadAt: 100 },
    ];

    const rows = buildShelfRows(history, manifest);

    expect(rows.map((row) => row.slug)).toEqual(["beta", "alpha"]);
    expect(rows[0]).toMatchObject({
      title: "Beta",
      label: "Essay",
      href: "/articles/beta",
      pct: 0.4,
      lastReadAt: 200,
    });
  });

  it("drops history entries with no matching manifest article", () => {
    const history: ReadingEntry[] = [
      { slug: "ghost", pct: 0.5, lastReadAt: 300 },
      { slug: "alpha", pct: 0.3, lastReadAt: 100 },
    ];

    const rows = buildShelfRows(history, manifest);

    expect(rows.map((row) => row.slug)).toEqual(["alpha"]);
  });

  it("returns an empty array for empty history", () => {
    expect(buildShelfRows([], manifest)).toEqual([]);
  });
});
