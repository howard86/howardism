import { describe, expect, it } from "bun:test";

import { groupArticlesByDomain } from "@/app/(blog)/articles/domain-groups";
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
    tag: "Concept",
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

describe("groupArticlesByDomain", () => {
  it("orders groups by member count descending", () => {
    const articles = [
      article("a1", { domain: "formal-math" }),
      article("a2", { domain: "agent-systems" }),
      article("a3", { domain: "agent-systems" }),
    ];

    const groups = groupArticlesByDomain(articles);

    expect(groups.map((g) => g.domain)).toEqual([
      "agent-systems",
      "formal-math",
    ]);
    expect(groups[0].articles.length).toBe(2);
    expect(groups[1].articles.length).toBe(1);
  });

  it("tie-breaks equal-count groups by DOMAIN_ORDER", () => {
    const articles = [
      article("a1", { domain: "startup-founder" }),
      article("a2", { domain: "agent-systems" }),
    ];

    const groups = groupArticlesByDomain(articles);

    expect(groups.map((g) => g.domain)).toEqual([
      "agent-systems",
      "startup-founder",
    ]);
  });

  it("drops articles with no domain", () => {
    const articles = [
      article("typed", { domain: "agent-systems" }),
      article("untyped"),
    ];

    const groups = groupArticlesByDomain(articles);

    expect(groups).toHaveLength(1);
    expect(groups[0].articles.map((a) => a.slug)).toEqual(["typed"]);
  });

  it("preserves the incoming article order within a group", () => {
    const articles = [
      article("newer", { domain: "agent-systems" }),
      article("older", { domain: "agent-systems" }),
    ];

    const [group] = groupArticlesByDomain(articles);

    expect(group.articles.map((a) => a.slug)).toEqual(["newer", "older"]);
  });
});
