// Run after `DEPLOY_TARGET=pages next build` + `build:pages-redirects`:
// asserts the static export is sound before it is published.
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

import { redirects } from "../src/config/redirects";
import { expandRedirects } from "./pages-redirects";

const REQUIRED_FILES = [
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
const ARTICLE_PAGE = /^articles\/[^/]+\/index\.html$/;
const SAMPLE_CAP = 20;
// src/app/not-found.tsx renders outside (blog)/layout.tsx (there is no root layout), so it has no CSP meta; fixing it needs a global-not-found restructure.
const CSP_EXEMPT = new Set([
  "404.html",
  "404/index.html",
  "_not-found/index.html",
]);
const NOINDEX_META = /<meta[^>]+name="robots"[^>]*noindex/i;
const CSP_META = /http-equiv="Content-Security-Policy"/i;
const SITEMAP_LINE = /^\s*Sitemap:/im;
const EXTENSION = /\.[a-z0-9]+$/i;
const EDGE_SLASHES = /^\/|\/$/g;

const capped = (paths: readonly string[]) =>
  paths.length > SAMPLE_CAP
    ? `${paths.slice(0, SAMPLE_CAP).join(", ")} (+${paths.length - SAMPLE_CAP} more)`
    : paths.join(", ");

/**
 * Pure checks over the export. `paths` lists every file (relative, posix);
 * `contents` holds the text of `*.html` files and `robots.txt`.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: flat list of independent assertions
export function checkExport(
  paths: readonly string[],
  contents: ReadonlyMap<string, string>,
  redirectSources: readonly string[]
): string[] {
  const failures: string[] = [];
  const present = new Set(paths);

  for (const file of REQUIRED_FILES) {
    if (!present.has(file)) {
      failures.push(`missing required file: ${file}`);
    }
  }

  const robots = contents.get("robots.txt");
  if (robots !== undefined) {
    if (!robots.includes("Allow: /")) {
      failures.push("robots.txt lacks `Allow: /`");
    }
    if (SITEMAP_LINE.test(robots)) {
      failures.push("robots.txt must not contain a `Sitemap:` line");
    }
  }

  const noRobots: string[] = [];
  const noCsp: string[] = [];
  for (const path of paths) {
    if (!(path.endsWith("index.html") || path === "404.html")) {
      continue;
    }
    const html = contents.get(path);
    if (html === undefined || html.includes('http-equiv="refresh"')) {
      continue;
    }
    if (!NOINDEX_META.test(html)) {
      noRobots.push(path);
    }
    if (!(CSP_EXEMPT.has(path) || CSP_META.test(html))) {
      noCsp.push(path);
    }
  }
  if (noRobots.length) {
    failures.push(
      `${noRobots.length} page(s) lack a robots noindex meta: ${capped(noRobots)}`
    );
  }
  if (noCsp.length) {
    failures.push(
      `${noCsp.length} page(s) lack a Content-Security-Policy meta: ${capped(noCsp)}`
    );
  }

  const missingStubs = redirectSources
    .map((source) => `${source.replace(EDGE_SLASHES, "")}/index.html`)
    .filter((file) => !present.has(file));
  if (missingStubs.length) {
    failures.push(
      `${missingStubs.length} redirect stub(s) missing: ${capped(missingStubs)}`
    );
  }

  const hasArticleBody = paths.some(
    (path) =>
      ARTICLE_PAGE.test(path) &&
      contents.get(path)?.includes("data-article-body")
  );
  if (!hasArticleBody) {
    failures.push("no articles/<slug>/index.html contains data-article-body");
  }

  const mdx = paths.filter((path) => path.endsWith(".mdx"));
  if (mdx.length) {
    failures.push(`${mdx.length} .mdx file(s) published: ${capped(mdx)}`);
  }

  return failures;
}

async function main() {
  const outDir = process.argv[2] ?? join(import.meta.dir, "..", "out");
  let entries: string[];
  try {
    entries = await readdir(outDir, { recursive: true });
  } catch {
    console.error(`verify-export: ${outDir} not found; build first`);
    process.exit(1);
  }
  const paths = entries
    .map((entry) => relative(outDir, join(outDir, entry)).replaceAll("\\", "/"))
    .filter((path) => EXTENSION.test(path));
  const contents = new Map<string, string>();
  await Promise.all(
    paths
      .filter((path) => path.endsWith(".html") || path === "robots.txt")
      .map(async (path) => {
        contents.set(path, await Bun.file(join(outDir, path)).text());
      })
  );

  const failures = checkExport(
    paths,
    contents,
    expandRedirects(redirects).map(({ source }) => source)
  );
  if (failures.length) {
    console.error(`verify-export: ${failures.length} failure(s)`);
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }
  const pages = paths.filter((path) => path.endsWith(".html")).length;
  console.log(`verify-export: OK (${paths.length} files, ${pages} html pages)`);
}

if (import.meta.main) {
  await main();
}
