import { access, mkdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { generateHeroImage } from "./codex.ts";
import {
  type ArticleMeta,
  emitArticle,
  WIKI_TAGS,
  type WikiTag,
} from "./emit.ts";
import {
  type ArticleGraph,
  buildArticleGraph,
  emitArticleGraph,
} from "./pages/graph.ts";
import { buildWikiChangelogPage } from "./pages/wiki-changelog.ts";
import { buildWikiLog, emitWikiLog } from "./pages/wiki-log.ts";
import { buildWikiSources, emitWikiSources } from "./pages/wiki-sources.ts";
import {
  buildSlugTitleMap,
  discoverWikiSources,
  extractRawSlugsFromBody,
  extractRawSlugsFromSources,
  loadRawDoc,
  normaliseTags,
  type ParsedWikiFile,
  parseIndexSummaries,
  parseWikiFile,
  type RawDoc,
  resolveDate,
  stripWikilinksToText,
  titleFromSlug,
} from "./parse.ts";
import { deriveTopic } from "./topics.ts";
import {
  buildSourcesSection,
  computeReadingTime,
  detectEntityPrefix,
  escapeMdxBody,
  firstParagraph,
  redactLocalPaths,
  rewriteWikilinks,
  type SourceRef,
  stripDuplicateLeadingHeading,
} from "./transform.ts";

interface RunOptions {
  blogArticlesPath: string;
  blogAssetsPath: string;
  dryRun: boolean;
  graphOutputPath: string;
  logOutputPath: string;
  onlySlug: string | null;
  overridesPath: string;
  rawPath: string;
  skipImages: boolean;
  sourcesOutputPath: string;
  wikiPath: string;
}

interface ImportSummary {
  articlesWritten: string[];
  graphPath: string | null;
  imagesCached: string[];
  imagesGenerated: string[];
  missingRawSources: Map<string, Set<string>>;
  unresolvedWikilinks: Map<string, Set<string>>;
}

const HERE = dirname(new URL(import.meta.url).pathname);
const CLI_ROOT = resolve(HERE, "../../");
const REPO_ROOT = resolve(CLI_ROOT, "../../");
const DEFAULT_BLOG_ARTICLES_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/content/articles"
);
const DEFAULT_BLOG_ASSETS_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/content/assets"
);
const DEFAULT_GRAPH_OUTPUT_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/data/article-graph.json"
);
const DEFAULT_LOG_OUTPUT_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/data/wiki-log.json"
);
const DEFAULT_SOURCES_OUTPUT_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/data/wiki-sources.json"
);
const DEFAULT_OVERRIDES_PATH = join(CLI_ROOT, "wiki-category-overrides.json");
/**
 * Codex's `workspace-write` sandbox only permits writes inside its workdir
 * (this CLI app). We stage generated PNGs here before moving them into the
 * blog's assets dir.
 */
const STAGING_DIR = join(CLI_ROOT, ".codex-staging");
const IMAGE_CONCURRENCY = 6;

async function main(): Promise<void> {
  const opts = parseOptions();
  console.log("[import-wiki] starting with options:", {
    wikiPath: opts.wikiPath,
    blogArticlesPath: opts.blogArticlesPath,
    onlySlug: opts.onlySlug,
    skipImages: opts.skipImages,
    dryRun: opts.dryRun,
  });

  await assertExists(opts.wikiPath, "wiki path");
  await assertExists(opts.rawPath, "raw path");
  if (!opts.dryRun) {
    await mkdir(opts.blogArticlesPath, { recursive: true });
    await mkdir(opts.blogAssetsPath, { recursive: true });
  }

  const ctx = await buildImportContext(opts);
  const summary = createSummary();

  // Archived articles are excluded from the link graph; drop them from the MDX
  // emission pipeline too so an author's `archived: true` keeps the entry off
  // the public blog. Mirrors the graph builder's predicate in emitGraph.
  const toEmit = ctx.parsedAll.filter(
    (parsed) => parsed.frontmatter.archived !== true
  );

  await runWithConcurrency(toEmit, IMAGE_CONCURRENCY, (parsed) =>
    processArticle(parsed, ctx, opts, summary)
  );

  if (!opts.onlySlug) {
    await emitWikiChangelogPage({
      opts,
      summary,
      slugTitleMap: ctx.slugTitleMap,
    });
    await emitGraph({ ctx, opts, summary });
    await emitWikiLogManifest({ opts });
    await emitWikiSourcesManifest({ ctx, opts });
  }

  printSummary(summary);
}

async function emitGraph(args: {
  ctx: ImportContext;
  opts: RunOptions;
  summary: ImportSummary;
}): Promise<void> {
  const { ctx, opts, summary } = args;
  const graph: ArticleGraph = buildArticleGraph({
    parsed: ctx.parsedAll,
    generatedOn: new Date().toISOString().slice(0, 10),
    isArchived: (p) => p.frontmatter.archived === true,
  });
  const graphPath = await emitArticleGraph({
    graph,
    outputPath: opts.graphOutputPath,
    dryRun: opts.dryRun,
  });
  summary.graphPath = graphPath;
}

async function emitWikiLogManifest(args: { opts: RunOptions }): Promise<void> {
  const { opts } = args;
  const logSource = join(opts.wikiPath, "log.md");
  const logParsed = await tryParseWikiLog(logSource);
  if (!logParsed) {
    return;
  }
  const log = buildWikiLog({
    body: logParsed.body,
    generatedOn: new Date().toISOString().slice(0, 10),
  });
  await emitWikiLog({
    log,
    outputPath: opts.logOutputPath,
    dryRun: opts.dryRun,
  });
}

async function emitWikiSourcesManifest(args: {
  ctx: ImportContext;
  opts: RunOptions;
}): Promise<void> {
  const { ctx, opts } = args;
  const live = ctx.parsedAll.filter((p) => p.frontmatter.archived !== true);
  const manifest = await buildWikiSources({
    parsed: live,
    rawRoot: opts.rawPath,
    generatedOn: new Date().toISOString().slice(0, 10),
  });
  await emitWikiSources({
    manifest,
    outputPath: opts.sourcesOutputPath,
    dryRun: opts.dryRun,
  });
}

interface ImportContext {
  indexSummaries: Map<string, string>;
  overrides: Record<string, WikiTag>;
  parsedAll: ParsedWikiFile[];
  slugTitleMap: Map<string, string>;
}

async function buildImportContext(opts: RunOptions): Promise<ImportContext> {
  const overrides = await loadOverrides(opts.overridesPath);
  const sources = await discoverWikiSources(opts.wikiPath);
  if (sources.length === 0) {
    throw new Error("No wiki files discovered");
  }

  // Parse every wiki file so the slug→title map covers all possible link
  // targets. Without this, `--only <slug>` would build a map containing only
  // the targeted article and every cross-link would be downgraded to plain
  // text.
  const allParsed = await Promise.all(sources.map(parseWikiFile));
  const slugTitleMap = buildSlugTitleMap(allParsed);

  const parsedAll = opts.onlySlug
    ? allParsed.filter((p) => p.source.slug === opts.onlySlug)
    : allParsed;
  if (parsedAll.length === 0) {
    throw new Error(`No wiki file found for slug "${opts.onlySlug}"`);
  }

  const indexSummaries = await parseIndexSummaries(
    join(opts.wikiPath, "index.md")
  );

  return { parsedAll, slugTitleMap, indexSummaries, overrides };
}

function createSummary(): ImportSummary {
  return {
    articlesWritten: [],
    graphPath: null,
    imagesGenerated: [],
    imagesCached: [],
    missingRawSources: new Map(),
    unresolvedWikilinks: new Map(),
  };
}

async function processArticle(
  parsed: ParsedWikiFile,
  ctx: ImportContext,
  opts: RunOptions,
  summary: ImportSummary
): Promise<void> {
  const { source, frontmatter } = parsed;
  const slug = source.slug;

  const title = frontmatter.title?.trim() || titleFromSlug(slug);
  const strippedBody = stripDuplicateLeadingHeading(parsed.body, title);
  const escapedBody = escapeMdxBody(strippedBody);

  const { sources, rawIndex } = await resolveRawSources({
    slug,
    frontmatterSources: frontmatter.sources,
    body: escapedBody,
    rawRoot: opts.rawPath,
    summary,
  });

  const { body: linkedBody, unresolved } = rewriteWikilinks(
    escapedBody,
    ctx.slugTitleMap,
    rawIndex
  );
  const redacted = redactLocalPaths(linkedBody);
  const sourcesSection = buildSourcesSection(sources);
  const body = sourcesSection ? `${sourcesSection}${redacted}` : redacted;
  if (unresolved.length > 0) {
    summary.unresolvedWikilinks.set(slug, new Set(unresolved));
  }

  const rawDescription =
    ctx.indexSummaries.get(slug) ??
    stripWikilinksToText(firstParagraph(parsed.body));
  const explicitOverride = ctx.overrides[slug];
  const defaultTag: WikiTag =
    source.folder === "concepts" ? "Concept" : "Essay";

  // Always strip the editorial `_Entity._` marker. If the article is otherwise
  // a default-tagged Concept (no explicit override), promote it to Entity.
  // An explicit override wins over the marker — that's the manual escape hatch.
  const { description: cleanedDescription, isEntity } =
    detectEntityPrefix(rawDescription);
  const tag: WikiTag =
    explicitOverride ??
    (isEntity && defaultTag === "Concept" ? "Entity" : defaultTag);

  const tags = normaliseTags(frontmatter.tags);

  const meta: ArticleMeta = {
    date: resolveDate(parsed),
    title,
    description: cleanedDescription,
    readingTime: computeReadingTime(body),
    tag,
    topic: deriveTopic(frontmatter.tags),
    ...(tags.length > 0 ? { tags } : {}),
    ...(sources.length > 0 ? { sources } : {}),
  };

  const imageFile = `${slug}.png`;
  await ensureImage({
    slug,
    title,
    body,
    imagePath: join(opts.blogAssetsPath, imageFile),
    skipImages: opts.skipImages,
    dryRun: opts.dryRun,
    summary,
  });

  const filePath = await emitArticle({
    articlesDir: opts.blogArticlesPath,
    slug,
    imageFile,
    imageAlt: `Illustration for ${title}`,
    meta,
    body,
    dryRun: opts.dryRun,
  });
  summary.articlesWritten.push(filePath);
}

/**
 * Resolve the raw-doc references for a single article: the `sources:`
 * frontmatter list drives the `## Sources` audit section, and any
 * `[[raw/...]]` inline mentions in the body get upgraded to clickable
 * links when the raw doc has a public URL.
 *
 * Both lookups share a single `rawIndex` so we never read the same raw
 * file twice in one article pass. Missing files become warnings via
 * `summary.missingRawSources` and still surface as plain-text entries.
 */
async function resolveRawSources(args: {
  body: string;
  frontmatterSources: string[] | undefined;
  rawRoot: string;
  slug: string;
  summary: ImportSummary;
}): Promise<{ rawIndex: Map<string, RawDoc>; sources: SourceRef[] }> {
  const { body, frontmatterSources, rawRoot, slug, summary } = args;

  const fromFrontmatter = extractRawSlugsFromSources(frontmatterSources);
  const fromBody = extractRawSlugsFromBody(body);
  const allSlugs = Array.from(new Set([...fromFrontmatter, ...fromBody]));

  const rawIndex = new Map<string, RawDoc>();
  const missing = new Set<string>();
  await Promise.all(
    allSlugs.map(async (rawSlug) => {
      const doc = await loadRawDoc(rawRoot, rawSlug);
      if (doc) {
        rawIndex.set(rawSlug, doc);
      } else {
        missing.add(rawSlug);
      }
    })
  );

  const sources: SourceRef[] = fromFrontmatter.map((rawSlug) => {
    const doc = rawIndex.get(rawSlug);
    if (doc) {
      return doc.url
        ? { title: doc.title, url: doc.url }
        : { title: doc.title };
    }
    return { title: humanizeMissingSlug(rawSlug) };
  });

  if (missing.size > 0) {
    summary.missingRawSources.set(slug, missing);
  }

  return { sources, rawIndex };
}

const MISSING_SLUG_PUNCT_RE = /[._-]+/g;
const MISSING_SLUG_WS_RE = /\s+/g;

function humanizeMissingSlug(slug: string): string {
  return slug
    .replace(MISSING_SLUG_PUNCT_RE, " ")
    .replace(MISSING_SLUG_WS_RE, " ")
    .trim();
}

async function ensureImage(args: {
  slug: string;
  title: string;
  body: string;
  imagePath: string;
  skipImages: boolean;
  dryRun: boolean;
  summary: ImportSummary;
}): Promise<void> {
  if (await fileExists(args.imagePath)) {
    args.summary.imagesCached.push(args.slug);
    return;
  }
  if (args.skipImages) {
    console.warn(
      `[import-wiki] SKIP_IMAGES=1 — leaving missing asset ${args.imagePath}`
    );
    return;
  }
  await generateHeroImage({
    title: args.title,
    body: args.body,
    outputPath: args.imagePath,
    stagingDir: STAGING_DIR,
    dryRun: args.dryRun,
  });
  args.summary.imagesGenerated.push(args.slug);
}

/**
 * Synthesize the wiki changelog article from the source `log.md`. The
 * previous wiki-index synthesized page was retired — `/articles` now serves
 * as the canonical index, and a permanent redirect from `/articles/wiki`
 * preserves the old URL. The changelog stays because its content is
 * structurally derived (chronological log entries) and isn't a wiki
 * article in its own right.
 */
async function emitWikiChangelogPage(args: {
  opts: RunOptions;
  slugTitleMap: Map<string, string>;
  summary: ImportSummary;
}): Promise<void> {
  const { opts, summary, slugTitleMap } = args;

  const logSource = join(opts.wikiPath, "log.md");
  const logParsed = await tryParseWikiLog(logSource);
  if (!logParsed) {
    return;
  }

  const changelogImageFile = "wiki-changelog.png";
  await ensureImage({
    slug: "wiki-changelog",
    title: "Wiki Changelog",
    body: logParsed.body,
    imagePath: join(opts.blogAssetsPath, changelogImageFile),
    skipImages: opts.skipImages,
    dryRun: opts.dryRun,
    summary,
  });
  const changelogPath = await buildWikiChangelogPage({
    parsed: logParsed,
    articlesDir: opts.blogArticlesPath,
    slug: "wiki-changelog",
    imageFile: changelogImageFile,
    slugTitleMap,
    dryRun: opts.dryRun,
  });
  summary.articlesWritten.push(changelogPath);
}

async function tryParseWikiLog(
  logPath: string
): Promise<ParsedWikiFile | null> {
  try {
    return await parseWikiFile({
      slug: "log",
      folder: "concepts",
      absolutePath: logPath,
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (true) {
        const i = nextIndex;
        nextIndex += 1;
        if (i >= items.length) {
          return;
        }
        results[i] = await worker(items[i]);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

function parseOptions(): RunOptions {
  const env = process.env;
  if (!env.WIKI_PATH) {
    throw new Error(
      "WIKI_PATH is required. Point it at the Obsidian wiki root (the directory containing `concepts/` and `derived/`)."
    );
  }
  const wikiPath = resolve(env.WIKI_PATH);
  // Raw source documents live as a sibling of the wiki dir in the standard
  // Obsidian-vault layout (`<vault>/wiki/` + `<vault>/raw/`). Override with
  // RAW_PATH when the vault is structured differently.
  const rawPath = resolve(env.RAW_PATH ?? join(wikiPath, "..", "raw"));
  const blogArticlesPath = resolve(
    env.BLOG_ARTICLES_PATH ?? DEFAULT_BLOG_ARTICLES_PATH
  );
  const blogAssetsPath = resolve(
    env.BLOG_ASSETS_PATH ?? DEFAULT_BLOG_ASSETS_PATH
  );
  const overridesPath = resolve(env.OVERRIDES_PATH ?? DEFAULT_OVERRIDES_PATH);
  const graphOutputPath = resolve(
    env.GRAPH_OUTPUT_PATH ?? DEFAULT_GRAPH_OUTPUT_PATH
  );
  const logOutputPath = resolve(env.LOG_OUTPUT_PATH ?? DEFAULT_LOG_OUTPUT_PATH);
  const sourcesOutputPath = resolve(
    env.SOURCES_OUTPUT_PATH ?? DEFAULT_SOURCES_OUTPUT_PATH
  );

  const argv = process.argv.slice(2);
  const onlyIndex = argv.indexOf("--only");
  const onlySlug = onlyIndex >= 0 ? (argv[onlyIndex + 1] ?? null) : null;

  return {
    wikiPath,
    rawPath,
    blogArticlesPath,
    blogAssetsPath,
    overridesPath,
    graphOutputPath,
    logOutputPath,
    sourcesOutputPath,
    onlySlug,
    skipImages: env.SKIP_IMAGES === "1",
    dryRun: env.DRY_RUN === "1",
  };
}

async function loadOverrides(path: string): Promise<Record<string, WikiTag>> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw err;
  }

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(raw) as Record<string, string>;
  } catch (err) {
    throw new Error(`Failed to parse ${path}: ${(err as Error).message}`);
  }

  for (const [slug, tag] of Object.entries(parsed)) {
    if (!WIKI_TAGS.includes(tag as WikiTag)) {
      throw new Error(
        `Invalid tag "${tag}" for "${slug}" in ${path} — must be one of ${WIKI_TAGS.join(", ")}`
      );
    }
  }
  return parsed as Record<string, WikiTag>;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function assertExists(path: string, label: string): Promise<void> {
  if (!(await fileExists(path))) {
    throw new Error(`${label} does not exist: ${path}`);
  }
}

function printSummary(summary: ImportSummary): void {
  console.log("\n=== Import summary ===");
  console.log(`Articles written: ${summary.articlesWritten.length}`);
  console.log(`Images generated: ${summary.imagesGenerated.length}`);
  console.log(`Images cached:    ${summary.imagesCached.length}`);
  if (summary.graphPath) {
    console.log(`Graph:            ${summary.graphPath}`);
  }
  if (summary.unresolvedWikilinks.size > 0) {
    console.log("\nUnresolved wikilinks (rendered as plain text):");
    for (const [slug, targets] of summary.unresolvedWikilinks) {
      console.log(`  ${slug} -> ${[...targets].join(", ")}`);
    }
  }
  if (summary.missingRawSources.size > 0) {
    console.log(
      "\nMissing raw source documents (rendered as humanised slug, no URL):"
    );
    for (const [slug, targets] of summary.missingRawSources) {
      console.log(`  ${slug} -> ${[...targets].join(", ")}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
