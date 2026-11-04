import { describe, expect, test } from "bun:test";

import {
  baseOpenGraph,
  baseTwitter,
  feedAlternates,
} from "../app/(blog)/shared-metadata";

describe("shared metadata", () => {
  test("open graph carries site name, GB locale and a default image", () => {
    expect(baseOpenGraph.locale).toBe("en_GB");
    expect(baseOpenGraph.siteName).toBeTruthy();
    expect(baseOpenGraph.images).toHaveLength(1);
  });

  test("twitter carries card, site and creator", () => {
    expect(baseTwitter.card).toBe("summary_large_image");
    expect(baseTwitter.site).toBe(baseTwitter.creator);
  });

  test("feed alternates advertise RSS and JSON Feed", () => {
    expect(Object.keys(feedAlternates)).toEqual([
      "application/rss+xml",
      "application/feed+json",
    ]);
  });
});
