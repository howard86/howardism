import { describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  budgetWarnings,
  buildReport,
  categorise,
  extractAssetRefs,
  findBuildId,
  humanBytes,
  isUnchanged,
  MARKER,
  normalise,
  type PageStat,
  type Report,
  renderComparison,
  routeGroup,
} from "../pages-export/size";

describe("buildReport", () => {
  it("keeps already-compressed assets at their byte size and reports pages", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "pages-size-"));
    try {
      await writeFile(
        join(outDir, "index.html"),
        '<script src="/_next/static/a.js"></script>'
      );
      await writeFile(join(outDir, "image.webp"), new Uint8Array(128));
      await mkdir(join(outDir, "_next", "static"), { recursive: true });
      await writeFile(
        join(outDir, "_next", "static", "a.js"),
        "console.log(1)"
      );
      const report = await buildReport(outDir);
      expect(report.totals.images.gzip).toBe(128);
      expect(report.pages?.["/"]?.js).toBeGreaterThan(0);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});

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

  it("collapses to one line when nothing changed", () => {
    const md = renderComparison(report(100_000), report(100_000));
    expect(md.split("\n")[0]).toBe(MARKER);
    expect(md).toContain(
      "No size change against the base export (2 files, 100.0 kB, 33.3 kB gzip)."
    );
    expect(md).not.toContain("| Category");
    expect(md).not.toContain("<details>");
  });

  it("words the head-only comment by base status", () => {
    const failed = renderComparison(undefined, report(1000), "failed");
    expect(failed.split("\n")[0]).toBe(MARKER);
    expect(failed).toContain("base export failed");
    expect(failed).not.toContain("No base report");
    const missing = renderComparison(undefined, report(1000), "missing");
    expect(missing.split("\n")[0]).toBe(MARKER);
    expect(missing).toContain("No base report available");
  });

  it("is not unchanged when a route differs", () => {
    const withPage = (jsGzip: number): Report => ({
      ...report(1000),
      pages: {
        "/": {
          group: "/",
          html: 1,
          htmlGzip: 1,
          js: jsGzip,
          jsGzip,
          css: 0,
          cssGzip: 0,
          rsc: 0,
          rscGzip: 0,
        },
      },
    });
    expect(isUnchanged(withPage(10), withPage(10))).toBe(true);
    expect(isUnchanged(withPage(10), withPage(11))).toBe(false);
  });

  it("emits budget warnings only past both thresholds", () => {
    const grown = renderComparison(
      report(100_000, 100_000),
      report(120_000, 120_000)
    );
    expect(grown.split("\n")[0]).toBe(MARKER);
    expect(grown).toContain("### Budget");
    expect(grown).toContain("total gzip grew");
    expect(
      budgetWarnings(report(100_000, 100_000), report(105_000, 105_000))
    ).toEqual([]);
    const quiet = renderComparison(
      report(100_000, 100_000),
      report(105_000, 105_000)
    );
    expect(quiet).not.toContain("### Budget");
  });

  it("warns on a route group whose JS grows >10% and >5 kB", () => {
    const withJs = (jsGzip: number): Report => ({
      ...report(1_000_000, 1_000_000),
      pages: {
        "/": {
          group: "/",
          html: 1,
          htmlGzip: 1,
          js: jsGzip,
          jsGzip,
          css: 0,
          cssGzip: 0,
          rsc: 0,
          rscGzip: 0,
        },
      },
    });
    expect(budgetWarnings(withJs(100_000), withJs(111_000))).toHaveLength(1);
    expect(budgetWarnings(withJs(100_000), withJs(104_000))).toEqual([]);
    expect(budgetWarnings(withJs(10_000), withJs(14_000))).toEqual([]);
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
    const md = renderComparison(report(2000), head);
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

describe("normalise", () => {
  it("swaps the build id for a same-length placeholder", () => {
    expect(findBuildId(["_next/static/AbC-123/_buildManifest.js"])).toBe(
      "AbC-123"
    );
    expect(normalise("a.txt", "x/AbC-123/y", "AbC-123")).toBe("x/xxxxxxx/y");
  });

  it("drops RSC flight chunk joints from html only and blanks lastBuildDate", () => {
    const joint = '"])</script><script>self.__next_f.push([1,"';
    expect(normalise("a.html", `a${joint}b`, undefined)).toBe("ab");
    expect(normalise("a.txt", `a${joint}b`, undefined)).toBe(`a${joint}b`);
    expect(
      normalise("f.xml", "<lastBuildDate>Mon</lastBuildDate>", undefined)
    ).toBe("<lastBuildDate></lastBuildDate>");
  });

  it("makes two builds with different ids measure identically", async () => {
    const make = async (id: string) => {
      const dir = await mkdtemp(join(tmpdir(), "pages-size-"));
      await mkdir(join(dir, "_next", "static", id), { recursive: true });
      await writeFile(
        join(dir, "_next", "static", id, "_buildManifest.js"),
        "m"
      );
      await writeFile(join(dir, "index.html"), `<p>${id}</p>`);
      return dir;
    };
    const [a, b] = [await make("IdNumberOne"), await make("IdNumberTwo")];
    try {
      expect(await buildReport(a)).toEqual(await buildReport(b));
    } finally {
      await rm(a, { recursive: true, force: true });
      await rm(b, { recursive: true, force: true });
    }
  });
});
