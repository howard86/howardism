import { describe, expect, it } from "bun:test";

import { checkExport } from "../../../scripts/verify-export";

const REQUIRED = [
  "index.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "rss/feed.xml",
  "rss/feed.json",
  "llms.txt",
  "compare/index.html",
  "articles/index.html",
  "zh-TW/articles/index.html",
];
const PAGE =
  '<meta name="robots" content="noindex"><meta http-equiv="Content-Security-Policy" content="x">';

function good() {
  const paths = [...REQUIRED, "articles/a/index.html", "old/index.html"];
  const contents = new Map<string, string>(
    paths
      .filter((p) => p.endsWith(".html"))
      .map((p) => [
        p,
        p === "articles/a/index.html"
          ? `${PAGE}<article data-article-body>`
          : PAGE,
      ])
  );
  contents.set("robots.txt", "User-agent: *\nAllow: /\n");
  return { paths, contents };
}

describe("checkExport", () => {
  it("passes a sound export", () => {
    const { paths, contents } = good();
    expect(checkExport(paths, contents, ["/old"])).toEqual([]);
  });

  it("reports missing files, sitemap line and mdx", () => {
    const { paths, contents } = good();
    contents.set("robots.txt", "Allow: /\nSitemap: https://x/sitemap.xml\n");
    const failures = checkExport(
      [...paths.filter((p) => p !== "llms.txt"), "a/b.mdx"],
      contents,
      []
    );
    expect(failures.join("\n")).toContain("missing required file: llms.txt");
    expect(failures.join("\n")).toContain("Sitemap:");
    expect(failures.join("\n")).toContain(".mdx");
  });

  it("flags real pages without noindex/CSP but skips stubs", () => {
    const { paths, contents } = good();
    contents.set("compare/index.html", "<html></html>");
    contents.set("old/index.html", '<meta http-equiv="refresh" content="0">');
    const failures = checkExport(paths, contents, ["/old"]).join("\n");
    expect(failures).toContain("noindex meta: compare/index.html");
    expect(failures).toContain(
      "Content-Security-Policy meta: compare/index.html"
    );
    expect(failures).not.toContain("old/index.html");
  });

  it("flags missing redirect stubs and article body", () => {
    const { paths, contents } = good();
    contents.set("articles/a/index.html", PAGE);
    const failures = checkExport(paths, contents, ["/gone"]).join("\n");
    expect(failures).toContain("gone/index.html");
    expect(failures).toContain("data-article-body");
  });

  it("exempts not-found pages from CSP but not from noindex", () => {
    const { paths, contents } = good();
    const withBare = [...paths, "404/index.html", "_not-found/index.html"];
    contents.set("404.html", '<meta name="robots" content="noindex">');
    contents.set("404/index.html", '<meta name="robots" content="noindex">');
    contents.set("_not-found/index.html", "<html></html>");
    const failures = checkExport(withBare, contents, ["/old"]).join("\n");
    expect(failures).not.toContain("Content-Security-Policy");
    expect(failures).toContain("noindex meta: _not-found/index.html");
  });
});
