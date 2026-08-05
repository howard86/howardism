import { describe, expect, it } from "bun:test";
import { formatAuthors } from "@/app/(blog)/desk";

describe("formatAuthors", () => {
  it("leaves a single author alone", () => {
    expect(formatAuthors("Anthropic")).toBe("Anthropic");
  });

  it("keeps both names for a pair", () => {
    expect(formatAuthors("Yuchen Zeng, Dimitris Papailiopoulos")).toBe(
      "Yuchen Zeng & Dimitris Papailiopoulos"
    );
  });

  it("collapses three or more to et al.", () => {
    expect(formatAuthors("Guangzhi Sun, Xiao Zhan, Mark Gales")).toBe(
      "Guangzhi Sun et al."
    );
  });

  it("ignores commas inside parentheses", () => {
    expect(
      formatAuthors("Lenny's Podcast (Lenny Rachitsky, with guest Cat Wu)")
    ).toBe("Lenny's Podcast (Lenny Rachitsky, with guest Cat Wu)");
  });

  it("splits on a top-level comma even when an aside follows", () => {
    expect(
      formatAuthors("Tim Genewein, Matija Franklin, Shane Legg (DeepMind)")
    ).toBe("Tim Genewein et al.");
  });
});
