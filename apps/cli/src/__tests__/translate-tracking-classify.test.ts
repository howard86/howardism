import { describe, expect, it } from "bun:test";
import { surfaceHash } from "../translate/surface.ts";
import { classifyArticle } from "../translate/tracking/classify.ts";

const mdx = (over: { body?: string; date?: string } = {}): string =>
  [
    "---",
    `date: ${over.date ?? "2026-05-06"}`,
    "title: Boris Cherny",
    "description: desc",
    "tag: Entity",
    "topic: orgs",
    "readingTime: 4",
    "imageAlt: alt",
    "---",
    'export { default as heroImage } from "../assets/boris-cherny.png";',
    "",
    over.body ?? "Body.",
  ].join("\n");

describe("classifyArticle", () => {
  const source = mdx();
  const hash = surfaceHash(source);

  it("returns 'missing' when no output exists", () => {
    expect(
      classifyArticle({
        sourceText: source,
        outputText: null,
        recordedHash: hash,
      })
    ).toBe("missing");
  });

  it("returns 'orphan' when the source is gone", () => {
    expect(
      classifyArticle({
        sourceText: null,
        outputText: mdx(),
        recordedHash: hash,
      })
    ).toBe("orphan");
  });

  it("returns 'stale' when there is no recorded hash", () => {
    expect(
      classifyArticle({
        sourceText: source,
        outputText: mdx(),
        recordedHash: null,
      })
    ).toBe("stale");
  });

  it("returns 'stale' when the translatable surface changed", () => {
    const changed = mdx({ body: "Rewritten." });
    expect(
      classifyArticle({
        sourceText: changed,
        outputText: mdx(),
        recordedHash: hash,
      })
    ).toBe("stale");
  });

  it("returns 'fresh' when hash matches and verbatim fields agree", () => {
    expect(
      classifyArticle({
        sourceText: source,
        outputText: mdx(),
        recordedHash: hash,
      })
    ).toBe("fresh");
  });

  it("returns 'verbatim-drift' when only a verbatim scalar differs", () => {
    // Source body unchanged (hash matches) but the source date moved on, so
    // the output's copied date is now out of sync.
    const newSource = mdx({ date: "2026-12-31" });
    expect(
      classifyArticle({
        sourceText: newSource,
        outputText: mdx({ date: "2026-05-06" }),
        recordedHash: surfaceHash(newSource),
      })
    ).toBe("verbatim-drift");
  });
});
