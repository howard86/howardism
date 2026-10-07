import { describe, expect, it } from "bun:test";

import {
  categorise,
  extractAssetRefs,
  humanBytes,
  MARKER,
  type PageStat,
  type Report,
  renderComparison,
  routeGroup,
} from "../pages-export/size";

const report = (bytes: number, gzip = bytes / 3): Report => ({
  totals: { js: { files: 2, bytes, gzip } },
  total: { files: 2, bytes, gzip },
  assets: {
    "_next/static/chunks/a.js": { bytes, gzip },
  },
});

describe("categorise", () => {
  it("maps extensions to categories", () => {
    expect(categorise("_next/static/a.js")).toBe("js");
    expect(categorise("a/b.css")).toBe("css");
    expect(categorise("index.html")).toBe("html");
    expect(categorise("x.WEBP")).toBe("images");
    expect(categorise("f.woff2")).toBe("fonts");
    expect(categorise("a/__next.txt")).toBe("data");
    expect(categorise("rss/feed.json")).toBe("data");
    expect(categorise("a.map")).toBe("other");
  });
});

describe("humanBytes", () => {
  it("uses base-1000 units with one decimal", () => {
    expect(humanBytes(999)).toBe("999 B");
    expect(humanBytes(1500)).toBe("1.5 kB");
    expect(humanBytes(2_500_000)).toBe("2.5 MB");
    expect(humanBytes(-1500)).toBe("-1.5 kB");
  });
});

describe("renderComparison", () => {
  it("starts with the marker", () => {
    expect(renderComparison(undefined, report(1000)).split("\n")[0]).toBe(
      MARKER
    );
  });

  it("renders head only when base is missing", () => {
    const md = renderComparison(undefined, report(1000));
    expect(md).toContain("No base report");
    expect(md).toContain("n/a");
    expect(md).not.toContain("⚠️");
  });

  it("shows zero delta without a warning", () => {
    const md = renderComparison(report(100_000), report(100_000));
    expect(md).toContain("0 B (0.0%)");
    expect(md).not.toContain("⚠️");
  });

  it("warns at >=5% or >=10 kB", () => {
    const pct = renderComparison(report(100_000), report(105_000));
    expect(pct).toContain("+5.0 kB (+5.0%) ⚠️");
    const abs = renderComparison(report(10_000_000), report(10_010_000));
    expect(abs).toContain("+10.0 kB (+0.1%) ⚠️");
    const small = renderComparison(report(100_000), report(104_000));
    expect(small).not.toContain("⚠️");
  });

  it("lists added and removed js assets", () => {
    const head = report(1000);
    head.assets = { "_next/static/chunks/b.js": { bytes: 1, gzip: 1 } };
    const md = renderComparison(report(1000), head);
    expect(md).toContain("added: 1, removed: 1");
  });
});

describe("routeGroup", () => {
  it("collapses dynamic segments", () => {
    expect(routeGroup("/articles/foo/")).toBe("/articles/[slug]/");
    expect(routeGroup("/zh-TW/articles/foo/")).toBe("/zh-TW/articles/[slug]/");
    expect(routeGroup("/articles/domain/ai/")).toBe(
      "/articles/domain/[domain]/"
    );
    expect(routeGroup("/articles/tag/Concept/")).toBe("/articles/tag/[tag]/");
    expect(routeGroup("/articles/tagged/x/")).toBe("/articles/tagged/[tag]/");
  });

  it("keeps everything else as its own group", () => {
    for (const route of [
      "/",
      "/articles/",
      "/compare/",
      "/zh-TW/articles/",
      "/404.html",
    ]) {
      expect(routeGroup(route)).toBe(route);
    }
  });
});

describe("extractAssetRefs", () => {
  it("returns unique _next/static scripts, stylesheets and script preloads", () => {
    const html = `
      <link rel="stylesheet" href="/_next/static/chunks/a.css" data-precedence="next"/>
      <link rel="preload" href="/_next/static/chunks/b.js" as="script"/>
      <script src="/_next/static/chunks/b.js" async=""></script>
      <script src="/_next/static/chunks/c.js?dpl=1"></script>
      <link rel="preload" href="/_next/static/media/f.woff2" as="font"/>
      <link rel="stylesheet" href="https://cdn.example/x.css"/>
      <script src="/other/d.js"></script>
      <script>inline()</script>`;
    expect(extractAssetRefs(html).sort()).toEqual([
      "_next/static/chunks/a.css",
      "_next/static/chunks/b.js",
      "_next/static/chunks/c.js",
    ]);
  });
});

const page = (group: string, jsGzip: number, htmlGzip = 1000): PageStat => ({
  group,
  html: htmlGzip * 3,
  htmlGzip,
  js: jsGzip * 3,
  jsGzip,
  css: 3000,
  cssGzip: 1000,
  rsc: 600,
  rscGzip: 200,
});

describe("per-page comparison", () => {
  const withPages = (pages: Record<string, PageStat>): Report => ({
    ...report(1000),
    pages,
  });
  const base = withPages({
    "/": page("/", 100_000),
    "/articles/a/": page("/articles/[slug]/", 100_000),
    "/articles/b/": page("/articles/[slug]/", 100_000),
    "/articles/gone/": page("/articles/[slug]/", 100_000),
  });
  const head = withPages({
    "/": page("/", 100_000),
    "/articles/a/": page("/articles/[slug]/", 130_000),
    "/articles/b/": page("/articles/[slug]/", 100_000),
    "/articles/new/": page("/articles/[slug]/", 100_000),
  });

  it("aggregates groups and renders deltas", () => {
    const md = renderComparison(base, head);
    expect(md).toContain("### Pages by route");
    expect(md).toContain(
      "| `/articles/[slug]/` | 3 (+1/−1) | 130.0 kB | 1.0 kB | 1.0 kB | 200 B | +30.0 kB (+30.0%) ⚠️ | 0 B (0.0%) |"
    );
    expect(md).toContain("| `/` | 1 | 100.0 kB |");
    expect(md.indexOf("`/articles/[slug]/`")).toBeLessThan(
      md.indexOf("| `/` |")
    );
  });

  it("lists the largest per-page changes and added/removed pages", () => {
    const md = renderComparison(base, head);
    expect(md).toContain("<summary>Largest per-page changes</summary>");
    expect(md).toContain(
      "| `/articles/a/` | 102.2 kB | 132.2 kB | +30.0 kB (+29.4%) ⚠️ |"
    );
    expect(md).not.toContain("| `/articles/b/` |");
    expect(md).toContain("Pages added: 1: `/articles/new/`");
    expect(md).toContain("Pages removed: 1: `/articles/gone/`");
  });

  it("renders n/a deltas and no per-page changes without a base", () => {
    const md = renderComparison(undefined, head);
    expect(md).toContain("### Pages by route");
    expect(md).toContain("| n/a | n/a |");
    expect(md).not.toContain("Largest per-page changes");
  });
});
