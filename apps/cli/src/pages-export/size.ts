// Size report for the Pages static export: `report` walks the out dir and
// writes JSON; `compare` renders a base-vs-head markdown table for a PR comment.
import { readdir, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

export const MARKER = "<!-- export-size-report -->";
export const CATEGORIES = [
  "js",
  "css",
  "html",
  "images",
  "fonts",
  "data",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Stat {
  bytes: number;
  gzip: number;
}
export interface PageStat {
  css: number;
  cssGzip: number;
  group: string;
  html: number;
  htmlGzip: number;
  js: number;
  jsGzip: number;
  rsc: number;
  rscGzip: number;
}
export interface Report {
  assets: Record<string, Stat>;
  /** Per-route weights; absent in reports written before this field existed. */
  pages?: Record<string, PageStat>;
  total: Stat & { files: number };
  totals: Record<string, Stat & { files: number }>;
}

const WARN_PERCENT = 5;
const WARN_BYTES = 10_000;
const TOP_ASSETS = 10;
const TOP_PAGE_CHANGES = 15;
const LISTED_ROUTES = 10;

const EXTENSIONS: Record<string, Category> = {
  ".js": "js",
  ".mjs": "js",
  ".css": "css",
  ".html": "html",
  ".png": "images",
  ".jpg": "images",
  ".jpeg": "images",
  ".webp": "images",
  ".avif": "images",
  ".gif": "images",
  ".svg": "images",
  ".ico": "images",
  ".woff": "fonts",
  ".woff2": "fonts",
  ".ttf": "fonts",
  ".otf": "fonts",
  ".txt": "data",
  ".json": "data",
  ".xml": "data",
};

export function categorise(path: string): Category {
  return EXTENSIONS[extname(path).toLowerCase()] ?? "other";
}

/** B/kB/MB, one decimal, base 1000. */
export function humanBytes(bytes: number): string {
  const abs = Math.abs(bytes);
  if (abs < 1000) {
    return `${bytes} B`;
  }
  if (abs < 1_000_000) {
    return `${(bytes / 1000).toFixed(1)} kB`;
  }
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

const signed = (bytes: number) => `${bytes > 0 ? "+" : ""}${humanBytes(bytes)}`;

function delta(head: number, base: number | undefined): string {
  if (base === undefined) {
    return "n/a";
  }
  const diff = head - base;
  const percent = base > 0 ? (diff / base) * 100 : undefined;
  const text =
    percent === undefined
      ? signed(diff)
      : `${signed(diff)} (${percent > 0 ? "+" : ""}${percent.toFixed(1)}%)`;
  const warn =
    Math.abs(diff) >= WARN_BYTES ||
    (percent !== undefined && Math.abs(percent) >= WARN_PERCENT);
  return warn ? `${text} ⚠️` : text;
}

const GROUP_PATTERNS: [RegExp, string][] = [
  [/^\/zh-TW\/articles\/[^/]+\/$/, "/zh-TW/articles/[slug]/"],
  [/^\/articles\/domain\/[^/]+\/$/, "/articles/domain/[domain]/"],
  [/^\/articles\/tagged\/[^/]+\/$/, "/articles/tagged/[tag]/"],
  [/^\/articles\/tag\/[^/]+\/$/, "/articles/tag/[tag]/"],
  [/^\/articles\/[^/]+\/$/, "/articles/[slug]/"],
];

const RESERVED_ARTICLE_ROUTES = new Set([
  "/articles/domain/",
  "/articles/tag/",
  "/articles/tagged/",
]);

/** Collapse dynamic route segments so pages of one template share a group. */
export function routeGroup(route: string): string {
  // `/articles/domain/` etc. are real index-less segments, not slugs.
  if (RESERVED_ARTICLE_ROUTES.has(route)) {
    return route;
  }
  for (const [pattern, group] of GROUP_PATTERNS) {
    if (pattern.test(route)) {
      return group;
    }
  }
  return route;
}

const TAG_PATTERN = /<(script|link)\b[^>]*>/gi;
const SRC_ATTR = /\bsrc="([^"]*)"/i;
const HREF_ATTR = /\bhref="([^"]*)"/i;
const REL_STYLESHEET = /\brel="stylesheet"/i;
const AS_SCRIPT = /\bas="script"/i;
const REL_PRELOAD = /\brel="preload"/i;
const QUERY_OR_HASH = /[?#]/;
const NEXT_STATIC_PREFIX = /^\/(_next\/static\/.*)$/;

/** Unique `_next/static` paths (relative to the out dir) a page loads as script or stylesheet. */
export function extractAssetRefs(html: string): string[] {
  const refs = new Set<string>();
  for (const [tag, name] of html.matchAll(TAG_PATTERN)) {
    const isScript = name.toLowerCase() === "script";
    const wanted = isScript
      ? SRC_ATTR.test(tag)
      : REL_STYLESHEET.test(tag) ||
        (REL_PRELOAD.test(tag) && AS_SCRIPT.test(tag));
    if (!wanted) {
      continue;
    }
    const url = (isScript ? SRC_ATTR : HREF_ATTR).exec(tag)?.[1];
    const path = url?.split(QUERY_OR_HASH)[0].match(NEXT_STATIC_PREFIX)?.[1];
    if (path) {
      refs.add(path);
    }
  }
  return [...refs];
}

const pageWeight = (p: PageStat) =>
  p.htmlGzip + p.jsGzip + p.cssGzip + p.rscGzip;

interface GroupStat {
  avgHtml: number;
  avgRsc: number;
  css: number;
  js: number;
  pages: Set<string>;
}

function aggregate(pages: Record<string, PageStat>): Map<string, GroupStat> {
  const groups = new Map<string, GroupStat>();
  const sums = new Map<string, { html: number; rsc: number }>();
  for (const [route, page] of Object.entries(pages)) {
    const g = groups.get(page.group) ?? {
      pages: new Set<string>(),
      js: 0,
      css: 0,
      avgHtml: 0,
      avgRsc: 0,
    };
    const sum = sums.get(page.group) ?? { html: 0, rsc: 0 };
    g.pages.add(route);
    g.js = Math.max(g.js, page.jsGzip);
    g.css = Math.max(g.css, page.cssGzip);
    sum.html += page.htmlGzip;
    sum.rsc += page.rscGzip;
    groups.set(page.group, g);
    sums.set(page.group, sum);
  }
  for (const [name, g] of groups) {
    const sum = sums.get(name) ?? { html: 0, rsc: 0 };
    g.avgHtml = Math.round(sum.html / g.pages.size);
    g.avgRsc = Math.round(sum.rsc / g.pages.size);
  }
  return groups;
}

function renderPages(
  base: Report | undefined,
  head: Report
): string[] | undefined {
  if (!head.pages) {
    return;
  }
  const headGroups = aggregate(head.pages);
  const baseGroups = base?.pages ? aggregate(base.pages) : undefined;
  const lines = [
    "",
    "### Pages by route",
    "",
    "| Route | Pages | First-load JS (gzip, max) | CSS (gzip) | HTML (gzip, avg) | RSC (gzip, avg) | Δ first-load JS | Δ HTML avg |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  const sorted = [...headGroups.entries()].sort(
    ([an, a], [bn, b]) => b.js - a.js || an.localeCompare(bn)
  );
  for (const [name, g] of sorted) {
    const b = baseGroups?.get(name);
    let count = `${g.pages.size}`;
    if (b) {
      const added = [...g.pages].filter((r) => !b.pages.has(r)).length;
      const removed = [...b.pages].filter((r) => !g.pages.has(r)).length;
      if (added || removed) {
        count += ` (+${added}/−${removed})`;
      }
    } else if (baseGroups) {
      count += ` (+${g.pages.size}/−0)`;
    }
    // Base present but group absent there means it is new: no Δ to show.
    const dJs = b ? delta(g.js, b.js) : "n/a";
    const dHtml = b ? delta(g.avgHtml, b.avgHtml) : "n/a";
    lines.push(
      `| \`${name}\` | ${count} | ${humanBytes(g.js)} | ${humanBytes(g.css)} | ${humanBytes(g.avgHtml)} | ${humanBytes(g.avgRsc)} | ${dJs} | ${dHtml} |`
    );
  }
  if (!base?.pages) {
    lines.push("");
    return lines;
  }

  const basePages = base.pages;
  const changes = Object.entries(head.pages)
    .filter(([route]) => route in basePages)
    .map(([route, page]) => {
      const before = pageWeight(basePages[route]);
      const after = pageWeight(page);
      return { route, before, after, diff: after - before };
    })
    .filter((c) => c.diff !== 0)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, TOP_PAGE_CHANGES);
  const addedRoutes = Object.keys(head.pages).filter((r) => !(r in basePages));
  const removedRoutes = Object.keys(basePages).filter(
    (r) => !(r in (head.pages ?? {}))
  );
  const listed = (routes: string[]) =>
    routes.length === 0
      ? ""
      : `: ${routes
          .slice(0, LISTED_ROUTES)
          .map((r) => `\`${r}\``)
          .join(", ")}${routes.length > LISTED_ROUTES ? ", …" : ""}`;
  lines.push(
    "",
    "<details>",
    "<summary>Largest per-page changes</summary>",
    "",
    "Total page weight = HTML + first-load JS + CSS + RSC payload, gzip.",
    "",
    "| Route | Before | After | Δ |",
    "| --- | ---: | ---: | ---: |",
    ...changes.map(
      (c) =>
        `| \`${c.route}\` | ${humanBytes(c.before)} | ${humanBytes(c.after)} | ${delta(c.after, c.before)} |`
    ),
    "",
    `Pages added: ${addedRoutes.length}${listed(addedRoutes)}`,
    "",
    `Pages removed: ${removedRoutes.length}${listed(removedRoutes)}`,
    "",
    "</details>",
    ""
  );
  return lines;
}

export function renderComparison(
  base: Report | undefined,
  head: Report
): string {
  const lines = [
    MARKER,
    "## Pages export size",
    "",
    base
      ? "Compared against the base branch export."
      : "No base report available; showing head only.",
    "",
    "| Category | Files | Size | Gzip | Δ size | Δ gzip |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
  ];
  const row = (
    name: string,
    h: Stat & { files: number },
    b: (Stat & { files: number }) | undefined
  ) => {
    // Base present but category absent there means it was empty.
    const baseStat = base ? (b ?? { bytes: 0, gzip: 0 }) : undefined;
    lines.push(
      `| ${name} | ${h.files} | ${humanBytes(h.bytes)} | ${humanBytes(h.gzip)} | ${delta(h.bytes, baseStat?.bytes)} | ${delta(h.gzip, baseStat?.gzip)} |`
    );
  };
  const empty = { files: 0, bytes: 0, gzip: 0 };
  for (const category of CATEGORIES) {
    const h = head.totals[category];
    if (h || base?.totals[category]) {
      row(category, h ?? empty, base?.totals[category]);
    }
  }
  row("**Total**", head.total, base?.total);
  lines.push(...(renderPages(base, head) ?? []));

  const headJs = Object.entries(head.assets).filter(([p]) => p.endsWith(".js"));
  const top = headJs
    .sort(([, a], [, b]) => b.bytes - a.bytes)
    .slice(0, TOP_ASSETS);
  lines.push(
    "",
    "<details>",
    `<summary>Top ${top.length} largest <code>_next/static</code> JS assets</summary>`,
    "",
    "| Asset | Size | Gzip |",
    "| --- | ---: | ---: |",
    ...top.map(
      ([path, s]) =>
        `| \`${path}\` | ${humanBytes(s.bytes)} | ${humanBytes(s.gzip)} |`
    )
  );
  if (base) {
    const baseJs = new Set(
      Object.keys(base.assets).filter((p) => p.endsWith(".js"))
    );
    const headSet = new Set(headJs.map(([p]) => p));
    const added = [...headSet].filter((p) => !baseJs.has(p)).length;
    const removed = [...baseJs].filter((p) => !headSet.has(p)).length;
    lines.push(
      "",
      `JS assets added: ${added}, removed: ${removed} (by path; content-hashed names make this noisy).`
    );
  }
  lines.push("", "</details>", "");
  return lines.join("\n");
}

export async function buildReport(outDir: string): Promise<Report> {
  const report: Report = {
    totals: {},
    total: { files: 0, bytes: 0, gzip: 0 },
    assets: {},
  };
  const entries = await readdir(outDir, { recursive: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = join(outDir, entry);
      if (!(await stat(full)).isFile()) {
        return;
      }
      const bytes = new Uint8Array(await Bun.file(full).arrayBuffer());
      return {
        rel: relative(outDir, full).replaceAll("\\", "/"),
        bytes: bytes.length,
        gzip: Bun.gzipSync(bytes).length,
      };
    })
  );
  const sizes = new Map<string, Stat>();
  for (const file of files) {
    if (!file) {
      continue;
    }
    const { rel, bytes, gzip } = file;
    sizes.set(rel, { bytes, gzip });
    const category = categorise(rel);
    report.totals[category] ??= { files: 0, bytes: 0, gzip: 0 };
    for (const t of [report.totals[category], report.total]) {
      t.files += 1;
      t.bytes += bytes;
      t.gzip += gzip;
    }
    if (
      rel.startsWith("_next/static/") &&
      (category === "js" || category === "css")
    ) {
      report.assets[rel] = { bytes, gzip };
    }
  }
  report.pages = await buildPages(outDir, sizes);
  return report;
}

const REFRESH_STUB = /http-equiv="refresh"/i;

async function buildPages(
  outDir: string,
  sizes: ReadonlyMap<string, Stat>
): Promise<Record<string, PageStat>> {
  const pageFiles = [...sizes.keys()].filter(
    (rel) =>
      rel === "404.html" || rel.endsWith("/index.html") || rel === "index.html"
  );
  const entries = await Promise.all(
    pageFiles.map(async (rel) => {
      const html = await Bun.file(join(outDir, rel)).text();
      if (REFRESH_STUB.test(html)) {
        return;
      }
      const dir =
        rel === "404.html" ? "404.html" : rel.slice(0, -"index.html".length);
      const route = rel === "404.html" ? "/404.html" : `/${dir}`;
      const own = sizes.get(rel) ?? { bytes: 0, gzip: 0 };
      const rsc = sizes.get(`${dir}index.txt`);
      const sum = { js: 0, jsGzip: 0, css: 0, cssGzip: 0 };
      for (const ref of extractAssetRefs(html)) {
        const asset = sizes.get(ref);
        if (!asset) {
          continue;
        }
        const key = ref.endsWith(".css") ? "css" : "js";
        sum[key] += asset.bytes;
        sum[`${key}Gzip`] += asset.gzip;
      }
      const page: PageStat = {
        group: routeGroup(route),
        html: own.bytes,
        htmlGzip: own.gzip,
        ...sum,
        rsc: rsc?.bytes ?? 0,
        rscGzip: rsc?.gzip ?? 0,
      };
      return [route, page] as const;
    })
  );
  const pages: Record<string, PageStat> = {};
  for (const entry of entries
    .filter((e) => e !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))) {
    pages[entry[0]] = entry[1];
  }
  return pages;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "report" && args.length === 2) {
    const [outDir, target] = args;
    const report = await buildReport(outDir);
    await Bun.write(target, `${JSON.stringify(report, null, 2)}\n`);
    console.log(
      `export-size: ${report.total.files} files, ${humanBytes(report.total.bytes)} (${humanBytes(report.total.gzip)} gzip)`
    );
    return;
  }
  if (command === "compare" && args.length === 3) {
    const [basePath, headPath, target] = args;
    const baseFile = Bun.file(basePath);
    const base = (await baseFile.exists())
      ? ((await baseFile.json()) as Report)
      : undefined;
    const head = (await Bun.file(headPath).json()) as Report;
    await Bun.write(target, renderComparison(base, head));
    return;
  }
  console.error(
    "usage: export-size.ts report <outDir> <out.json> | compare <base.json> <head.json> <out.md>"
  );
  process.exit(1);
}

if (import.meta.main) {
  await main();
}
