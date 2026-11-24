import { describe, expect, it } from "bun:test";

import { checkExport, checkVercelExport } from "../pages-export/verify";

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
const PAGE = '<meta http-equiv="Content-Security-Policy" content="x">';
const NOINDEX = '<meta name="robots" content="noindex, nofollow">';

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
  contents.set(
    "robots.txt",
    "User-agent: *\nAllow: /\nSitemap: https://x/sitemap.xml\n"
  );
  return { paths, contents };
}

describe("checkExport", () => {
  it("passes a sound export", () => {
    const { paths, contents } = good();
    expect(checkExport(paths, contents, ["/old"])).toEqual([]);
  });

  it("retains identical outcomes when page contents contain only check flags", () => {
    const { paths, contents } = good();
    contents.set("articles/a/index.html", `${PAGE}data-article-body`);
    expect(checkExport(paths, contents, ["/old"])).toEqual([]);
  });

  it("reports missing files, sitemap line and mdx", () => {
    const { paths, contents } = good();
    contents.set("robots.txt", "Allow: /\n");
    const failures = checkExport(
      [...paths.filter((p) => p !== "llms.txt"), "a/b.mdx"],
      contents,
      []
    );
    expect(failures.join("\n")).toContain("missing required file: llms.txt");
    expect(failures.join("\n")).toContain("Sitemap:");
    expect(failures.join("\n")).toContain(".mdx");
  });

  it("flags noindexed key pages and pages without CSP, but skips stubs", () => {
    const { paths, contents } = good();
    contents.set("articles/index.html", `${PAGE}${NOINDEX}`);
    contents.set("compare/index.html", "<html></html>");
    contents.set("old/index.html", '<meta http-equiv="refresh" content="0">');
    const failures = checkExport(paths, contents, ["/old"]).join("\n");
    expect(failures).toContain("noindex meta: articles/index.html");
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

  it("warns, not fails, on not-found renders at real paths", () => {
    const { paths, contents } = good();
    const bare = '<meta name="robots" content="noindex"/>';
    const extra = ["404/index.html", "zh-TW/articles/moc-x/index.html"];
    contents.set("404.html", bare);
    contents.set("404/index.html", bare);
    contents.set("zh-TW/articles/moc-x/index.html", bare);
    const warnings: string[] = [];
    const failures = checkExport(
      [...paths, ...extra],
      contents,
      ["/old"],
      warnings
    );
    expect(failures).toEqual([]);
    expect(warnings).toEqual([
      "1 not-found render(s) at real paths: zh-TW/articles/moc-x/index.html",
    ]);
  });

  it("fails a page without CSP whose robots is not bare noindex", () => {
    const { paths, contents } = good();
    contents.set(
      "compare/index.html",
      '<meta name="robots" content="noindex, nofollow"/>'
    );
    const warnings: string[] = [];
    const failures = checkExport(paths, contents, ["/old"], warnings).join(
      "\n"
    );
    expect(failures).toContain(
      "Content-Security-Policy meta: compare/index.html"
    );
    expect(warnings).toEqual([]);
  });

  it("allows pages that opt out of indexing on purpose", () => {
    const { paths, contents } = good();
    contents.set("compare/index.html", `${PAGE}${NOINDEX}`);
    expect(checkExport(paths, contents, ["/old"])).toEqual([]);
  });
});

describe("checkVercelExport", () => {
  const VPAGE = NOINDEX;
  function vgood() {
    const paths = [
      "index.html",
      "404.html",
      "robots.txt",
      "sitemap.xml",
      "rss/feed.xml",
      "rss/feed.json",
      "llms.txt",
      "compare.html",
      "articles.html",
      "zh-TW/articles.html",
      "articles/a.html",
    ];
    const contents = new Map<string, string>(
      paths
        .filter((p) => p.endsWith(".html"))
        .map((p) => [
          p,
          p === "articles/a.html"
            ? `${VPAGE}<article data-article-body>`
            : VPAGE,
        ])
    );
    contents.set("404.html", '<meta name="robots" content="noindex"/>');
    contents.set("robots.txt", "User-agent: *\nAllow: /\n");
    return { paths, contents };
  }

  it("passes a sound vercel export", () => {
    const { paths, contents } = vgood();
    expect(checkVercelExport(paths, contents)).toEqual([]);
  });

  it("reports missing required files", () => {
    const { paths, contents } = vgood();
    const failures = checkVercelExport(
      paths.filter((p) => p !== "articles.html"),
      contents
    );
    expect(failures.join("\n")).toContain(
      "missing required file: articles.html"
    );
  });

  it("fails on leaked trailing-slash pages", () => {
    const { paths, contents } = vgood();
    contents.set("articles/index.html", VPAGE);
    const failures = checkVercelExport(
      [...paths, "articles/index.html"],
      contents
    ).join("\n");
    expect(failures).toContain("trailing-slash");
    expect(failures).toContain("articles/index.html");
  });

  it("fails on indexable pages", () => {
    const { paths, contents } = vgood();
    contents.set("compare.html", "<html></html>");
    const failures = checkVercelExport(paths, contents).join("\n");
    expect(failures).toContain("lack a robots noindex meta: compare.html");
  });

  it("warns on stray not-found renders", () => {
    const { paths, contents } = vgood();
    contents.set(
      "zh-TW/articles/x.html",
      '<meta name="robots" content="noindex"/>'
    );
    const warnings: string[] = [];
    const failures = checkVercelExport(
      [...paths, "zh-TW/articles/x.html"],
      contents,
      warnings
    ).join("\n");
    expect(failures).toBe("");
    expect(warnings).toEqual([
      "1 not-found render(s) at real paths: zh-TW/articles/x.html",
    ]);
  });

  it("fails without article body, robots Allow, or with mdx", () => {
    const { paths, contents } = vgood();
    contents.set("articles/a.html", VPAGE);
    contents.set("robots.txt", "User-agent: *\n");
    const failures = checkVercelExport([...paths, "a.mdx"], contents).join(
      "\n"
    );
    expect(failures).toContain("data-article-body");
    expect(failures).toContain("Allow: /");
    expect(failures).toContain(".mdx");
  });
});
