import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { ArticleEntity, LatestRelease } from "./articles/service";
import { ThisIssue } from "./this-issue";

const entity = (slug: string): ArticleEntity =>
  ({
    slug,
    meta: { title: `Title ${slug}`, domain: "agent-systems", tag: "Concept" },
  }) as unknown as ArticleEntity;

const release = (sources: number): LatestRelease => ({
  entry: {
    date: "2026-11-01",
    new: ["n1"],
    no: 7,
    resolved: [],
    revised: ["r1"],
    sourcesGained: {},
  },
  groups: Array.from({ length: sources }, (_, i) => ({
    title: `Source ${i}`,
    new: i === 0 ? ["n1"] : [],
    revised: i === 0 ? ["r1"] : [],
    touched: 1,
  })),
  newSlugs: ["n1"],
  prevDate: "2026-10-01",
  revisedSlugs: ["r1"],
  upkeep: ["u1", "u2"],
});

const entities = { n1: entity("n1"), r1: entity("r1"), u1: entity("u1") };

describe("ThisIssue", () => {
  it("renders the head, filed and revised notes, and the upkeep line", () => {
    const html = renderToStaticMarkup(
      <ThisIssue entities={entities} release={release(2)} sources={new Map()} />
    );
    expect(html).toContain("Plate · 07");
    expect(html).toContain("Filed · 1");
    expect(html).toContain("Revised · 1");
    expect(html).toContain("/articles/n1");
    expect(html).toContain(
      "2 notes revised for links, merges and corrections."
    );
    expect(html).not.toContain("<details");
  });

  it("puts sources past the sixth behind a disclosure", () => {
    const html = renderToStaticMarkup(
      <ThisIssue entities={entities} release={release(8)} sources={new Map()} />
    );
    expect(html).toContain("All 8 sources this issue →");
    expect(html.indexOf("<details")).toBeLessThan(html.indexOf("Source 7"));
    expect(html.indexOf("<details")).toBeGreaterThan(html.indexOf("Source 5"));
  });
});
