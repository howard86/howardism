import { describe, expect, it } from "bun:test";

import { TAG_SECTIONS } from "@/app/(blog)/articles/tag-sections";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  it("includes an entry for every /articles/tag section page", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    for (const section of TAG_SECTIONS) {
      expect(
        urls.some((url) => url.endsWith(`/articles/tag/${section.slug}`))
      ).toBe(true);
    }
  });

  it("still includes the home and articles index entries", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls.some((url) => url.endsWith("/articles"))).toBe(true);
    expect(urls.length).toBeGreaterThanOrEqual(2 + TAG_SECTIONS.length);
  });
});
