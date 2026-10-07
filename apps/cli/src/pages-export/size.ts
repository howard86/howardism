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
export interface Report {
  assets: Record<string, Stat>;
  total: Stat & { files: number };
  totals: Record<string, Stat & { files: number }>;
}

const WARN_PERCENT = 5;
const WARN_BYTES = 10_000;
const TOP_ASSETS = 10;

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
  for (const file of files) {
    if (!file) {
      continue;
    }
    const { rel, bytes, gzip } = file;
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
  return report;
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
