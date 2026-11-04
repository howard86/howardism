import { describe, expect, it } from "bun:test";

import { GET as getJson } from "@/app/rss/feed.json/route";
import { GET as getXml } from "@/app/rss/feed.xml/route";

const IMAGE_PNG = /<image>\s*<title>[\s\S]*?<url>[^<]*\.png<\/url>/;

describe("feeds", () => {
  it("serves JSON Feed 1.1 with authors and summary", async () => {
    const feed = await (await getJson()).json();

    expect(feed.version).toBe("https://jsonfeed.org/version/1.1");
    expect(feed.author).toBeUndefined();
    expect(feed.authors[0].name).toBeString();
    expect(feed.icon).toEndWith(".png");
    expect(feed.items.length).toBeGreaterThan(0);
    for (const item of feed.items) {
      expect(item.author).toBeUndefined();
      expect(item.authors).toHaveLength(1);
      expect(item.summary).toBeString();
    }
  });

  it("serves RSS with a PNG channel image, language and categories", async () => {
    const response = await getXml();
    const xml = await response.text();

    expect(response.headers.get("Content-Type")).toContain("xml");
    expect(xml).toContain("<language>en</language>");
    expect(xml).toMatch(IMAGE_PNG);
    expect(xml).toContain("<category>");
  });
});
