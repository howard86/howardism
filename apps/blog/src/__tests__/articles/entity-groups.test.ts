import { describe, expect, it } from "bun:test";

import {
  describeEntityGroup,
  groupEntityArticles,
} from "@/app/(blog)/articles/entity-groups";
import type { ArticleEntity, ArticleMeta } from "@/app/(blog)/articles/service";

function article(
  slug: string,
  overrides: Partial<ArticleMeta> = {}
): ArticleEntity {
  const meta: ArticleMeta = {
    date: "2026-01-01",
    description: "d",
    imageAlt: "alt",
    readingTime: 1,
    tag: "Entity",
    title: slug,
    ...overrides,
  };
  return {
    heroImage: { src: "/x.png", height: 100, width: 100 },
    meta,
    position: 0,
    slug,
  };
}

describe("groupEntityArticles", () => {
  it("orders groups by member count descending", () => {
    const articles = [
      article("org-a", { entityType: "organization", title: "Org A" }),
      article("person-a", { entityType: "person", title: "Person A" }),
      article("person-b", { entityType: "person", title: "Person B" }),
    ];

    const groups = groupEntityArticles(articles);

    expect(groups.map((g) => g.label)).toEqual(["People", "Organizations"]);
    expect(groups[0].articles.length).toBe(2);
    expect(groups[1].articles.length).toBe(1);
  });

  it("sorts within a group alphabetically by title", () => {
    const articles = [
      article("z", { entityType: "software", title: "Zeta Tool" }),
      article("a", { entityType: "software", title: "Alpha Tool" }),
    ];

    const [group] = groupEntityArticles(articles);
    expect(group.articles.map((a) => a.slug)).toEqual(["a", "z"]);
  });

  it("sorts the model group by date descending instead of alphabetically", () => {
    const articles = [
      article("old-model", {
        entityType: "model",
        title: "Alpha Model",
        date: "2026-01-01",
      }),
      article("new-model", {
        entityType: "model",
        title: "Zeta Model",
        date: "2026-06-01",
      }),
    ];

    const [group] = groupEntityArticles(articles);
    expect(group.articles.map((a) => a.slug)).toEqual([
      "new-model",
      "old-model",
    ]);
  });

  it("keeps articles with no entityType in a trailing, unlabeled group", () => {
    const articles = [
      article("typed", { entityType: "person", title: "Typed" }),
      article("untyped", { title: "Untyped" }),
    ];

    const groups = groupEntityArticles(articles);
    const last = groups.at(-1);

    expect(last?.label).toBeUndefined();
    expect(last?.articles.map((a) => a.slug)).toEqual(["untyped"]);
  });
});

describe("describeEntityGroup", () => {
  it("notes newest-first ordering for the Models group", () => {
    expect(
      describeEntityGroup({ type: "model", label: "Models", articles: [] })
    ).toContain("newest first");
  });

  it("notes alphabetical ordering for other named groups", () => {
    expect(
      describeEntityGroup({ type: "person", label: "People", articles: [] })
    ).toContain("alphabetical");
  });

  it("keys the ordering note off the type, not the display label", () => {
    expect(
      describeEntityGroup({
        type: "model",
        label: "Model releases",
        articles: [],
      })
    ).toContain("newest first");
  });

  it("describes the unlabeled group", () => {
    expect(
      describeEntityGroup({ type: undefined, label: undefined, articles: [] })
    ).toContain("no recorded type");
  });
});
