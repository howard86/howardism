import { describe, expect, it } from "bun:test";

import { ArticleRail } from "@/app/[locale]/(blog)/articles/[slug]/article-rail";
import type { ArticleHeading } from "@/app/[locale]/(blog)/articles/service";

// A slug absent from the article graph: getArticleConnections resolves to
// empty arrays, so `headings` is the rail's only content source.
const SLUG_WITHOUT_LINKS = "slug-absent-from-article-graph";

const HEADING: ArticleHeading = { depth: 2, id: "intro", text: "Intro" };

describe("ArticleRail empty guard (#780)", () => {
  it("returns null when TOC, related, and backlinks are all empty", async () => {
    const result = await ArticleRail({
      headings: [],
      slug: SLUG_WITHOUT_LINKS,
    });

    expect(result).toBeNull();
  });

  it("renders the rail when at least one heading is present", async () => {
    const result = await ArticleRail({
      headings: [HEADING],
      slug: SLUG_WITHOUT_LINKS,
    });

    expect(result).not.toBeNull();
  });
});
