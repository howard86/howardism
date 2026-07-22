import { access, mkdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import {
  type SourceRef,
  WIKI_TAGS,
  type WikiDomain,
  type WikiTag,
} from "@howardism/article-contract";
import { runWithConcurrency } from "../concurrency.ts";
import { generateHeroImage as generateAgyHeroImage } from "./agy/index.ts";
import { generateHeroImage as generateCodexHeroImage } from "./codex.ts";
import {
  buildDomainMembership,
  isMocSlug,
  OPEN_QUESTIONS_SLUG,
  resolveDomain,
} from "./domains.ts";
import { type ArticleMeta, emitArticle } from "./emit.ts";
import { buildManifests, writeManifests } from "./pages/manifests.ts";
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
} from "./parse.ts";
import { deriveVaultSlugSet, pruneOrphanedArticles } from "./prune.ts";
import {
  buildSourcesSection,
  computeReadingTime,
  detectEntityPrefix,
  escapeMdxBody,
  firstBlockquote,
  firstHeading,
  firstParagraph,
  redactLocalPaths,
  rewriteWikilinks,
  stripAuthoringTags,
  stripDuplicateLeadingHeading,
  stripHtmlComments,
} from "./transform.ts";
import { titleFromSlug } from "./wikilink.ts";

interface RunOptions {
  blogArticlesPath: string;
  blogAssetsPath: string;
  blogZhArticlesPath: string;
  dryRun: boolean;
  graphOutputPath: string;
  onlySlug: string | null;
  openQuestionsOutputPath: string;
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
  /** Slugs pruned because their vault note was deleted or renamed. */
  prunedArticles: string[];
  /** Concept-folder notes not listed in any MOC; fell back to `syntheses`. */
  unmappedConcepts: Set<string>;
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
const DEFAULT_BLOG_ZH_ARTICLES_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/content/articles-zh-TW"
);
const DEFAULT_GRAPH_OUTPUT_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/data/article-graph.json"
);
const DEFAULT_SOURCES_OUTPUT_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/data/wiki-sources.json"
);
const DEFAULT_OPEN_QUESTIONS_OUTPUT_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/data/open-questions.json"
);
const DEFAULT_OVERRIDES_PATH = join(CLI_ROOT, "wiki-category-overrides.json");
/**
 * The agent's sandbox only permits writes inside its workdir
 * (this CLI app). We stage generated PNGs here before moving them into the
 * blog's assets dir.
 */
const STAGING_DIR = join(
  CLI_ROOT,
  (process.env.IMAGE_PROVIDER || "codex") === "agy"
    ? ".agy-staging"
    : ".codex-staging"
);
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
    const generatedOn = new Date().toISOString().slice(0, 10);
    const set = await buildManifests({
      parsed: ctx.parsedAll,
      rawRoot: opts.rawPath,
      generatedOn,
      membership: ctx.domainMembership,
      slugTitleMap: ctx.slugTitleMap,
    });
    const { graphPath } = await writeManifests({
      set,
      graphOutputPath: opts.graphOutputPath,
      sourcesOutputPath: opts.sourcesOutputPath,
      openQuestionsOutputPath: opts.openQuestionsOutputPath,
      dryRun: opts.dryRun,
    });
    summary.graphPath = graphPath;

    summary.prunedArticles = await pruneOrphanedArticles({
      articlesDir: opts.blogArticlesPath,
      assetsDir: opts.blogAssetsPath,
      zhArticlesDir: opts.blogZhArticlesPath,
      vaultSlugs: ctx.vaultSlugSet,
      onlySlug: opts.onlySlug,
      dryRun: opts.dryRun,
    });
  }

  printSummary(summary);
}

interface ImportContext {
  domainMembership: Map<string, WikiDomain>;
  indexSummaries: Map<string, string>;
  overrides: Record<string, WikiTag>;
  parsedAll: ParsedWikiFile[];
  slugTitleMap: Map<string, string>;
  /**
   * Slug set of the full, pre-`--only`-filter vault corpus — includes
   * `archived: true` notes, which are excluded from emission but still exist
   * in the vault. Used to detect orphaned on-disk articles; see prune.ts.
   */
  vaultSlugSet: Set<string>;
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
  // MOC pages own the domain-membership map, so build it from the full corpus
  // (before any --only filter) — a targeted re-import still needs every MOC.
  const domainMembership = buildDomainMembership(allParsed);

  const parsedAll = opts.onlySlug
    ? allParsed.filter((p) => p.source.slug === opts.onlySlug)
    : allParsed;
  if (parsedAll.length === 0) {
    throw new Error(`No wiki file found for slug "${opts.onlySlug}"`);
  }

  const indexSummaries = await parseIndexSummaries(
    join(opts.wikiPath, "index.md")
  );

  return {
    parsedAll,
    slugTitleMap,
    domainMembership,
    indexSummaries,
    overrides,
    vaultSlugSet: deriveVaultSlugSet(allParsed),
  };
}

function createSummary(): ImportSummary {
  return {
    articlesWritten: [],
    graphPath: null,
    imagesGenerated: [],
    imagesCached: [],
    missingRawSources: new Map(),
    prunedArticles: [],
    unmappedConcepts: new Set(),
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

  // A MOC's `MOC — …` frontmatter title duplicates its `Index` badge and never
  // matches the clean `# Domain` body heading, so the page renders two
  // near-identical headings. Prefer the body heading as the display title;
  // `stripDuplicateLeadingHeading` then removes it from the body.
  const bodyHeading = isMocSlug(slug) ? firstHeading(parsed.body) : "";
  const title = bodyHeading || frontmatter.title?.trim() || titleFromSlug(slug);
  const strippedBody = stripDuplicateLeadingHeading(parsed.body, title);
  // Drop the vault's `<!-- BEGIN/END GENERATED: moc -->` markers before escaping
  // — MDX would otherwise render them as a visible `&lt;!--` literal.
  const escapedBody = escapeMdxBody(
    stripAuthoringTags(stripHtmlComments(strippedBody))
  );

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

  // MOC and the open-questions backlog are wiki navigation, not editorial
  // prose — they belong in the `Index` kind, kept out of Concept/Essay.
  const isIndexPage = isMocSlug(slug) || slug === OPEN_QUESTIONS_SLUG;

  // A MOC's first content is a `<!-- BEGIN GENERATED -->` marker, so its
  // description must come from the `> Map of Content…` blockquote intro rather
  // than the usual first-paragraph fallback.
  const mocDescription = isMocSlug(slug)
    ? stripWikilinksToText(firstBlockquote(parsed.body))
    : "";
  const rawDescription =
    ctx.indexSummaries.get(slug) ||
    mocDescription ||
    stripWikilinksToText(firstParagraph(parsed.body));
  const explicitOverride = ctx.overrides[slug];
  const defaultTag: WikiTag =
    source.folder === "concepts" ? "Concept" : "Essay";

  // Always strip the editorial `_Entity._` marker. If the article is otherwise
  // a default-tagged Concept (no explicit override), promote it to Entity.
  // An explicit override wins over everything — that's the manual escape hatch.
  const { description: cleanedDescription, isEntity } =
    detectEntityPrefix(rawDescription);
  const tag = resolveTag({
    explicitOverride,
    isIndexPage,
    isEntity,
    defaultTag,
  });

  const tags = normaliseTags(frontmatter.tags);

  const domain = resolveDomain(slug, ctx.domainMembership);
  // A concept the vault forgot to file under any MOC lands in `syntheses` by
  // fallback — flag it so the author can curate it into the right domain.
  if (
    source.folder === "concepts" &&
    !isMocSlug(slug) &&
    !ctx.domainMembership.has(slug)
  ) {
    summary.unmappedConcepts.add(slug);
  }

  const meta: ArticleMeta = {
    date: resolveDate(parsed),
    title,
    description: cleanedDescription,
    readingTime: computeReadingTime(body),
    tag,
    domain,
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
 * Pick an article's kind. An explicit override always wins; otherwise Index
 * pages (MOCs, the backlog) take precedence, then the `_Entity._` promotion,
 * then the folder default (concepts → Concept, derived → Essay).
 */
function resolveTag(args: {
  defaultTag: WikiTag;
  explicitOverride: WikiTag | undefined;
  isEntity: boolean;
  isIndexPage: boolean;
}): WikiTag {
  const { defaultTag, explicitOverride, isEntity, isIndexPage } = args;
  if (explicitOverride) {
    return explicitOverride;
  }
  if (isIndexPage) {
    return "Index";
  }
  if (isEntity && defaultTag === "Concept") {
    return "Entity";
  }
  return defaultTag;
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
  const provider = process.env.IMAGE_PROVIDER || "codex";
  if (provider === "agy") {
    await generateAgyHeroImage({
      title: args.title,
      body: args.body,
      outputPath: args.imagePath,
      stagingDir: STAGING_DIR,
      dryRun: args.dryRun,
    });
  } else {
    await generateCodexHeroImage({
      title: args.title,
      body: args.body,
      outputPath: args.imagePath,
      stagingDir: STAGING_DIR,
      dryRun: args.dryRun,
    });
  }
  args.summary.imagesGenerated.push(args.slug);
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
  const blogZhArticlesPath = resolve(
    env.BLOG_ZH_ARTICLES_PATH ?? DEFAULT_BLOG_ZH_ARTICLES_PATH
  );
  const overridesPath = resolve(env.OVERRIDES_PATH ?? DEFAULT_OVERRIDES_PATH);
  const graphOutputPath = resolve(
    env.GRAPH_OUTPUT_PATH ?? DEFAULT_GRAPH_OUTPUT_PATH
  );
  const sourcesOutputPath = resolve(
    env.SOURCES_OUTPUT_PATH ?? DEFAULT_SOURCES_OUTPUT_PATH
  );
  const openQuestionsOutputPath = resolve(
    env.OPEN_QUESTIONS_OUTPUT_PATH ?? DEFAULT_OPEN_QUESTIONS_OUTPUT_PATH
  );

  const argv = process.argv.slice(2);
  const onlyIndex = argv.indexOf("--only");
  const onlySlug = onlyIndex >= 0 ? (argv[onlyIndex + 1] ?? null) : null;

  return {
    wikiPath,
    rawPath,
    blogArticlesPath,
    blogAssetsPath,
    blogZhArticlesPath,
    overridesPath,
    graphOutputPath,
    sourcesOutputPath,
    openQuestionsOutputPath,
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
  if (summary.prunedArticles.length > 0) {
    console.log("\nPruned orphaned articles (vault note deleted or renamed):");
    for (const slug of summary.prunedArticles) {
      console.log(`  ${slug}`);
    }
  }
  if (summary.unmappedConcepts.size > 0) {
    console.log(
      "\nConcepts not listed in any MOC (filed under `syntheses` by fallback):"
    );
    for (const slug of [...summary.unmappedConcepts].sort()) {
      console.log(`  ${slug}`);
    }
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
