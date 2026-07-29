import { describe, expect, it } from "bun:test";

import { rewriteHeroImportToWebp } from "../webp.ts";

const hero = (file: string) =>
  `---\ntitle: X\n---\nexport { default as heroImage } from "../assets/${file}";\n\nBody.\n`;

describe("rewriteHeroImportToWebp", () => {
  it("swaps the hero import extension and leaves the rest byte-identical", () => {
    expect(rewriteHeroImportToWebp(hero("the-bitter-lesson.png"))).toBe(
      hero("the-bitter-lesson.webp")
    );
  });

  it("is a no-op on an already-migrated article", () => {
    const raw = hero("a.webp");
    expect(rewriteHeroImportToWebp(raw)).toBe(raw);
  });

  it("leaves MDX with no hero import untouched", () => {
    const raw = "---\ntitle: X\n---\n\nBody with a /y.png link.\n";
    expect(rewriteHeroImportToWebp(raw)).toBe(raw);
  });

  it("does not touch PNG references outside the hero import line", () => {
    const raw = `${hero("a.png")}\n![alt](/diagram.png)\n`;
    expect(rewriteHeroImportToWebp(raw)).toContain("![alt](/diagram.png)");
  });
});
