import { describe, expect, it } from "bun:test";

import type {
  ArticleEntity,
  ArticleMeta,
  Normalise,
} from "@/app/(blog)/articles/service";
import { buildManifestEntries } from "@/app/shelf/manifest.json/route";

// Cast rather than satisfy ArticleEntity's full shape — this branch must not
// rely on `heroImage`, which a sibling branch removes from the type.
function entity(meta: Partial<ArticleMeta>, slug: string): ArticleEntity {
  return {
    position: 0,
    slug,
    meta: {
      title: "Title",
      description: "d",
      date: "2026-01-01",
      readingTime: 5,
      tag: "Concept",
      ...meta,
    },
  } as ArticleEntity;
}

describe("buildManifestEntries", () => {
  it("includes an archived article, not just visible ones", () => {
    const articles: Normalise<ArticleEntity> = {
      ids: ["alpha", "archived-one"],
      entities: {
        alpha: entity({}, "alpha"),
        "archived-one": entity(
          { title: "Archived One", archived: true },
          "archived-one"
        ),
      },
    };

    const manifest = buildManifestEntries(articles);

    const archived = manifest.find((e) => e.slug === "archived-one");
    expect(archived).toBeDefined();
    expect(archived?.archived).toBe(true);
  });
});
