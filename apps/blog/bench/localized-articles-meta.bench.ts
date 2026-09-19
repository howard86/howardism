// C1: the /zh-TW/articles index used to dynamically import all 274 compiled
// zh-TW MDX modules — each pulling its component tree and hero image — to read
// three frontmatter fields. It now reads `articles-meta.zh-TW.json`.
//
// The old path cannot run here: `import("@/content/articles-zh-TW/<slug>.mdx")`
// only resolves inside the Next bundler. The floor below is the cheapest
// possible stand-in for it — reading the same 274 files off disk and scraping
// the three fields with a regex, with no YAML parse, no MDX compile, no module
// graph and no image chain — so the real before-figure is strictly larger.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { plugin } from "bun";

import { bench, benchAsync, checksum, log, ZH_ARTICLES_DIR } from "./harness";

// service.ts is a server module. Outside Next there is no `react-server`
// resolution condition, so importing `server-only` would throw.
plugin({
  name: "server-only-stub",
  setup(build) {
    build.module("server-only", () => ({ exports: {}, loader: "object" }));
  },
});

const zhFiles = readdirSync(ZH_ARTICLES_DIR)
  .filter((name) => name.endsWith(".mdx"))
  .sort();

const FIELD_RE = /^(title|description|date):[ \t]*(.*)$/gm;

bench("floor: read + scrape 274 zh-TW MDX frontmatters", () =>
  zhFiles.map((name) => {
    const raw = readFileSync(join(ZH_ARTICLES_DIR, name), "utf8");
    FIELD_RE.lastIndex = 0;
    return [...raw.slice(0, raw.indexOf("\n---", 4)).matchAll(FIELD_RE)];
  })
);

const service = await import("../src/app/(blog)/articles/service");

const coldStarted = performance.now();
const entries = await service.getTranslatedArticleLinks();
log(
  `${"getTranslatedArticleLinks() cold (import+parse)".padEnd(48)} ${(performance.now() - coldStarted).toFixed(2).padStart(13)} ms   n=1`
);
log(`  entries ${entries.length}  checksum ${checksum(entries)}`);

await benchAsync(
  "getTranslatedArticleLinks() memoised",
  () => service.getTranslatedArticleLinks(),
  20
);
