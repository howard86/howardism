import { describe, expect, it } from "bun:test";

import type { ArticleHeading } from "@/app/(blog)/articles/service";
// Imported via the preload-linked support module rather than the module under
// test directly: article-layout.test stubs "@/app/(blog)/articles/[slug]/
// article-rail" with a process-wide mock, so importing it here would yield that
// stub depending on file order. The support module holds the real binding (#780).
import { ArticleRail } from "@/test-support/real-article-modules";

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
