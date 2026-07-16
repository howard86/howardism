import { describe, expect, it } from "bun:test";

import type { ArticleGraph } from "@howardism/article-contract/manifests/graph";
import type { OpenQuestionsManifest } from "@howardism/article-contract/manifests/open-questions";
import type { WikiSourcesManifest } from "@howardism/article-contract/manifests/wiki-sources";

import {
  type ArticleRecord,
  checkFrontmatter,
  checkGraphSlugRefs,
  checkHeroImages,
  checkOpenQuestionSlugRefs,
  checkWikiSourceSlugRefs,
  extractHeroImage,
  findDomainsWithoutMoc,
  findOrphanArticles,
  findOrphanPngs,
  parseArticle,
} from "../content-check.ts";

function article(overrides: Partial<ArticleRecord> = {}): ArticleRecord {
  return {
    slug: "a",
    title: "Title",
    description: "Description",
    imageAlt: "Alt",
    domain: "ai-engineering",
    heroImage: "a.png",
    ...overrides,
  };
}

function mdx(frontmatter: string, hero = "../assets/a.png"): string {
  return [
    "---",
    frontmatter,
    "---",
    `export { default as heroImage } from "${hero}";`,
    "",
    "Body.",
    "",
  ].join("\n");
}

describe("extractHeroImage", () => {
  it("captures the PNG filename from the import line", () => {
    expect(extractHeroImage(mdx("title: X"))).toBe("a.png");
  });

  it("returns null when no import line is present", () => {
    expect(extractHeroImage("---\ntitle: X\n---\n\nBody.")).toBeNull();
  });
});

describe("parseArticle", () => {
  it("reads and trims required frontmatter plus the hero image", () => {
    const raw = mdx(
      [
        "title:  Trimmed  ",
        "description: A desc",
        "imageAlt: Alt text",
        "domain: llm-architecture",
      ].join("\n"),
      "../assets/slug.png"
    );
    expect(parseArticle(raw, "slug")).toEqual({
      slug: "slug",
      title: "Trimmed",
      description: "A desc",
      imageAlt: "Alt text",
      domain: "llm-architecture",
      heroImage: "slug.png",
    });
  });

  it("defaults missing fields to empty string and null domain", () => {
    const parsed = parseArticle(mdx("title: Only"), "only");
    expect(parsed.description).toBe("");
    expect(parsed.imageAlt).toBe("");
    expect(parsed.domain).toBeNull();
  });
});

describe("checkHeroImages", () => {
  it("passes when every hero image resolves to an asset", () => {
    const articles = [article({ slug: "a", heroImage: "a.png" })];
    expect(checkHeroImages(articles, new Set(["a.png"]))).toEqual([]);
  });

  it("flags a hero image with no matching PNG", () => {
    const articles = [article({ slug: "gone", heroImage: "gone.png" })];
    const failures = checkHeroImages(articles, new Set(["a.png"]));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("gone.png");
  });

  it("flags an article with no hero import line", () => {
    const articles = [article({ slug: "bare", heroImage: null })];
    const failures = checkHeroImages(articles, new Set());
    expect(failures[0]).toContain("no heroImage import");
  });
});

describe("checkGraphSlugRefs", () => {
  const slugs = new Set(["a", "b"]);

  it("passes when all keys and values are real articles", () => {
    const graph: ArticleGraph = {
      backlinks: { a: ["b"], b: ["a"] },
      outgoing: { a: ["b"] },
      related: { b: ["a"] },
      generatedOn: "2026-01-01",
    };
    expect(checkGraphSlugRefs(graph, slugs)).toEqual([]);
  });

  it("flags a dangling value slug and a dangling key slug", () => {
    const graph: ArticleGraph = {
      backlinks: { a: ["ghost"] },
      outgoing: { phantom: ["a"] },
      related: {},
      generatedOn: "2026-01-01",
    };
    const failures = checkGraphSlugRefs(graph, slugs);
    expect(failures.join("\n")).toContain("ghost");
    expect(failures.join("\n")).toContain("phantom");
    expect(failures).toHaveLength(2);
  });
});

describe("checkOpenQuestionSlugRefs", () => {
  it("flags a concept slug with no article", () => {
    const manifest: OpenQuestionsManifest = {
      byConcept: [
        { slug: "a", title: "A", domain: "ai-engineering", questions: ["q"] },
        {
          slug: "missing",
          title: "M",
          domain: "ai-engineering",
          questions: [],
        },
      ],
      generatedOn: "2026-01-01",
    };
    const failures = checkOpenQuestionSlugRefs(manifest, new Set(["a"]));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("missing");
  });
});

describe("checkWikiSourceSlugRefs", () => {
  it("flags a citedBy slug with no article", () => {
    const manifest: WikiSourcesManifest = {
      sources: [{ title: "Paper", kind: "Paper", citedBy: ["a", "ghost"] }],
      generatedOn: "2026-01-01",
    };
    const failures = checkWikiSourceSlugRefs(manifest, new Set(["a"]));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("ghost");
  });
});

describe("checkFrontmatter", () => {
  it("passes when title, description and imageAlt are all present", () => {
    expect(checkFrontmatter([article()])).toEqual([]);
  });

  it("lists every missing field in one message per article", () => {
    const failures = checkFrontmatter([
      article({ slug: "bad", title: "", description: "", imageAlt: "" }),
    ]);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("title");
    expect(failures[0]).toContain("description");
    expect(failures[0]).toContain("imageAlt");
  });
});

describe("findOrphanArticles", () => {
  it("flags articles with missing or empty backlinks", () => {
    const articles = [
      article({ slug: "linked" }),
      article({ slug: "empty" }),
      article({ slug: "absent" }),
    ];
    const backlinks = { linked: ["other"], empty: [] };
    expect(findOrphanArticles(articles, backlinks)).toEqual([
      "empty",
      "absent",
    ]);
  });

  it("exempts moc-* start-here pages", () => {
    const articles = [article({ slug: "moc-ai-engineering" })];
    expect(findOrphanArticles(articles, {})).toEqual([]);
  });
});

describe("findDomainsWithoutMoc", () => {
  it("flags domains lacking a moc-<domain> article, sorted", () => {
    const articles = [
      article({ slug: "moc-ai-engineering", domain: "ai-engineering" }),
      article({ slug: "note-1", domain: "ai-engineering" }),
      article({ slug: "note-2", domain: "syntheses" }),
      article({ slug: "note-3", domain: "product-org" }),
    ];
    expect(findDomainsWithoutMoc(articles)).toEqual([
      "product-org",
      "syntheses",
    ]);
  });

  it("ignores articles without a domain", () => {
    expect(findDomainsWithoutMoc([article({ domain: null })])).toEqual([]);
  });
});

describe("findOrphanPngs", () => {
  it("flags PNGs with no matching article slug, sorted", () => {
    const assets = new Set(["a.png", "orphan.png", "z-orphan.png"]);
    expect(findOrphanPngs(assets, new Set(["a"]))).toEqual([
      "orphan.png",
      "z-orphan.png",
    ]);
  });
});
