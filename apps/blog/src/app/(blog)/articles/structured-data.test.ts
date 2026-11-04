import { describe, expect, it } from "bun:test";

import {
  buildArticleBreadcrumbs,
  buildBlogPosting,
  buildWebSite,
} from "./structured-data";

const base = {
  domainLabel: "Agent Systems",
  images: [{ src: "/_next/static/media/a-800.webp" }, { src: "/a.webp" }],
  profileUrls: ["https://github.com/Howard86/", "mailto:h@example.com"],
  siteName: "Howardism",
  siteUrl: "https://www.howardism.dev",
  slug: "foo",
  meta: {
    date: "2026-01-02",
    description: "d",
    tags: ["x"],
    title: "Foo",
  },
};

describe("buildBlogPosting", () => {
  it("builds an English post with absolute images and no mailto sameAs", () => {
    const post = buildBlogPosting({ ...base, locale: "en" });
    expect(post["@type"]).toBe("BlogPosting");
    expect(post.mainEntityOfPage).toEqual({
      "@type": "WebPage",
      "@id": "https://www.howardism.dev/articles/foo",
    });
    expect(post.image).toEqual([
      "https://www.howardism.dev/_next/static/media/a-800.webp",
      "https://www.howardism.dev/a.webp",
    ]);
    expect((post.author as { sameAs: string[] }).sameAs).toEqual([
      "https://github.com/Howard86/",
    ]);
    expect(post.keywords).toEqual(["x"]);
    expect(post.articleSection).toBe("Agent Systems");
    expect(post.translationOfWork).toBeUndefined();
  });

  it("links a zh-TW post to its English original", () => {
    const post = buildBlogPosting({ ...base, locale: "zh-TW" });
    expect(post.inLanguage).toBe("zh-TW");
    expect(post.url).toBe("https://www.howardism.dev/zh-TW/articles/foo");
    expect(post.translationOfWork).toMatchObject({
      url: "https://www.howardism.dev/articles/foo",
    });
  });

  it("omits keywords and section when absent", () => {
    const post = buildBlogPosting({
      ...base,
      domainLabel: undefined,
      locale: "en",
      meta: { ...base.meta, tags: [] },
    });
    expect("keywords" in post).toBe(false);
    expect("articleSection" in post).toBe(false);
  });
});

describe("buildArticleBreadcrumbs", () => {
  it("lists Home, Articles, Domain, Title with positions", () => {
    const crumbs = buildArticleBreadcrumbs({
      domain: "agent-systems",
      domainLabel: "Agent Systems",
      locale: "zh-TW",
      siteUrl: base.siteUrl,
      slug: "foo",
      title: "Foo",
    });
    expect(crumbs.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.howardism.dev/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Articles",
        item: "https://www.howardism.dev/zh-TW/articles",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Agent Systems",
        item: "https://www.howardism.dev/articles/domain/agent-systems",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Foo",
        item: "https://www.howardism.dev/zh-TW/articles/foo",
      },
    ]);
  });

  it("skips the domain crumb without a domain", () => {
    const crumbs = buildArticleBreadcrumbs({
      locale: "en",
      siteUrl: base.siteUrl,
      slug: "foo",
      title: "Foo",
    });
    expect((crumbs.itemListElement as unknown[]).length).toBe(3);
  });
});

describe("buildWebSite", () => {
  it("names the site and points at the home page", () => {
    expect(
      buildWebSite({ siteName: "Howardism", siteUrl: base.siteUrl })
    ).toMatchObject({
      "@type": "WebSite",
      name: "Howardism",
      url: "https://www.howardism.dev/",
    });
  });
});
