import { describe, expect, it } from "bun:test";

import { buildFacets } from "@/components/search/scope-bar";
import type { SearchEntry } from "@/components/search/search-data";

const entry = (over: Partial<SearchEntry>): SearchEntry => ({
  slug: "s",
  title: "T",
  description: "d",
  tag: "Concept",
  keywords: "",
  ...over,
});

describe("buildFacets", () => {
  it("counts domains and kinds present in the result set", () => {
    const facets = buildFacets([
      entry({ slug: "a", domain: "agent-systems" }),
      entry({ slug: "b", domain: "agent-systems" }),
      entry({ slug: "c", domain: "interpretability", tag: "Essay" }),
    ]);

    expect(facets).toContainEqual({
      field: "domain",
      value: "agent-systems",
      count: 2,
      label: "Agent Systems",
    });
    expect(facets).toContainEqual({
      field: "tag",
      value: "Essay",
      count: 1,
      label: "Essay",
    });
  });

  it("orders by the site's taxonomy, not by count, so chips never reshuffle", () => {
    // "agent-systems" leads DOMAIN_ORDER, so it comes first despite being the
    // rarer of the two — a chip row that reorders per keystroke is unusable.
    const facets = buildFacets([
      entry({ slug: "a", domain: "interpretability" }),
      entry({ slug: "b", domain: "interpretability" }),
      entry({ slug: "c", domain: "agent-systems" }),
    ]);
    const domains = facets.filter((f) => f.field === "domain");
    expect(domains.map((f) => f.value)).toEqual([
      "agent-systems",
      "interpretability",
    ]);
  });

  it("lists domains before kinds", () => {
    const facets = buildFacets([entry({ domain: "agent-systems" })]);
    expect(facets.map((f) => f.field)).toEqual(["domain", "tag"]);
  });

  it("omits a domain facet for articles that have no domain", () => {
    const facets = buildFacets([entry({ domain: undefined })]);
    expect(facets.every((f) => f.field === "tag")).toBe(true);
  });

  it("returns nothing for an empty result set", () => {
    expect(buildFacets([])).toEqual([]);
  });
});
