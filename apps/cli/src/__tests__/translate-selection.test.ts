import { describe, expect, it } from "bun:test";
import { selectActionableSlugs } from "../translate/index.ts";

describe("selectActionableSlugs", () => {
  it("applies the limit after fresh articles have been classified away", () => {
    expect(
      selectActionableSlugs(
        [
          { slug: "already-fresh", status: "fresh" },
          { slug: "needs-translation", status: "missing" },
          { slug: "also-needs-translation", status: "missing" },
        ],
        1,
        { force: false, update: false }
      )
    ).toEqual(["needs-translation"]);
  });
});
