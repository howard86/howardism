import { describe, expect, it } from "bun:test";

import { buildCompareHref, resolveCompareIds } from "@/lib/compare-ids";

const known = new Set(["alpha", "beta", "gamma", "delta"]);

describe("resolveCompareIds", () => {
  it("keeps known slugs in their given order", () => {
    expect(resolveCompareIds("beta,alpha", known)).toEqual(["beta", "alpha"]);
  });

  it("drops unknown slugs", () => {
    expect(resolveCompareIds("alpha,ghost,beta", known)).toEqual([
      "alpha",
      "beta",
    ]);
  });

  it("collapses duplicates to first occurrence", () => {
    expect(resolveCompareIds("alpha,alpha,beta,alpha", known)).toEqual([
      "alpha",
      "beta",
    ]);
  });

  it("caps the set at three", () => {
    expect(resolveCompareIds("alpha,beta,gamma,delta", known)).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
  });

  it("trims whitespace around slugs", () => {
    expect(resolveCompareIds(" alpha , beta ", known)).toEqual([
      "alpha",
      "beta",
    ]);
  });

  it("returns an empty list for empty, missing, or garbage input", () => {
    expect(resolveCompareIds("", known)).toEqual([]);
    expect(resolveCompareIds(undefined, known)).toEqual([]);
    expect(resolveCompareIds("  , ,", known)).toEqual([]);
    expect(resolveCompareIds("ghost,phantom", known)).toEqual([]);
  });

  it("flattens a repeated query param array before resolving", () => {
    expect(resolveCompareIds(["alpha", "beta"], known)).toEqual([
      "alpha",
      "beta",
    ]);
  });
});

describe("buildCompareHref", () => {
  it("builds the compare URL from a selection", () => {
    expect(buildCompareHref(["alpha", "beta"])).toBe("/compare?ids=alpha,beta");
  });

  it("round-trips through resolveCompareIds", () => {
    const href = buildCompareHref(["alpha", "beta"]);
    const ids = href.split("ids=")[1];
    expect(resolveCompareIds(ids, known)).toEqual(["alpha", "beta"]);
  });
});
