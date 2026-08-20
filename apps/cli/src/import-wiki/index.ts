import { access, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import {
  type EntityType,
  type SourceRef,
  WIKI_TAGS,
  type WikiDomain,
  type WikiTag,
} from "@howardism/article-contract";
import { titleFromSlug } from "@howardism/article-contract/markup";
import { runWithConcurrency } from "../concurrency.ts";
import { writeSearchIndex } from "../search-index.ts";
import { pngToWebp } from "../webp.ts";
import { generateHeroImage as generateAgyHeroImage } from "./agy/index.ts";
import { assertCatalogFresh, type CatalogRow, loadCatalog } from "./catalog.ts";
import { generateHeroImage as generateCodexHeroImage } from "./codex.ts";
import { buildDomainMembership, isMocSlug, resolveDomain } from "./domains.ts";
import { type ArticleMeta, emitArticle } from "./emit.ts";
import {
  buildEntityTypeMembership,
  isEntityNote,
  resolveEntityType,
} from "./entity-types.ts";
import { buildManifests, writeManifests } from "./pages/manifests.ts";
import {
  buildSlugTitleMap,
  discoverWikiSources,
  extractRawSlugsFromBody,
  extractRawSlugsFromSources,
  loadRawDoc,
  normaliseTags,
  type ParsedWikiFile,
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

interface RunOptions {
  blogArticlesPath: string;
  blogAssetsPath: string;
  blogZhArticlesPath: string;
  catalogPath: string;
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
  /** Slugs whose frontmatter `domain:` disagrees with their MOC membership. */
  domainDisagreements: Map<string, { frontmatter: string; moc: string }>;
  /** Slugs whose frontmatter `kind:` disagrees with `moc-entities.md`. */
  entityTypeDisagreements: Map<string, { frontmatter: string; moc: string }>;
  /**
   * Slugs whose description came from the first-paragraph fallback only — no
   * `summary:` frontmatter, no index.md entry, no MOC blockquote. A spike
   * here means a vault digest/frontmatter source went missing on import.
   */
  fallbackDescriptions: string[];
  graphPath: string | null;
  imagesCached: string[];
  imagesGenerated: string[];
  missingRawSources: Map<string, Set<string>>;
  /** Slugs pruned because their vault note was deleted or renamed. */
  prunedArticles: string[];
  searchIndex: { entryCount: number; outputPath: string } | null;
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
const WEBP_SUFFIX = /\.webp$/;

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
  await assertExists(opts.catalogPath, "catalog path");
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

    summary.searchIndex = await writeSearchIndex({ dryRun: opts.dryRun });
  }

  printSummary(summary);

  // This failure class — the vault regenerates a digest/frontmatter source
  // and the importer silently degrades to the first-paragraph heuristic —
  // has hit three times. A `--only` re-import of a single article is exempt;
  // it can't move the corpus-wide ratio anyway.
  if (!opts.onlySlug && toEmit.length > 0) {
    const fallbackRatio = summary.fallbackDescriptions.length / toEmit.length;
    if (fallbackRatio > 0.1) {
      const examples = summary.fallbackDescriptions.slice(0, 5).join(", ");
      throw new Error(
        `${summary.fallbackDescriptions.length}/${toEmit.length} article descriptions ` +
          `(${Math.round(fallbackRatio * 100)}%) fell back to the first-paragraph ` +
          "heuristic — likely vault frontmatter/digest drift (missing `summary:` " +
          `frontmatter or a _system/catalog.tsv row). Examples: ${examples}`
      );
    }
  }
}

interface ImportContext {
  catalog: Map<string, CatalogRow>;
  domainMembership: Map<string, WikiDomain>;
  entityTypeMembership: Map<string, EntityType>;
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

  // The catalog is the domain + description source of truth (see catalog.ts),
  // so it must be fresh and cover the full corpus before any --only filter.
  await assertCatalogFresh(opts.catalogPath, allParsed);
  const catalog = await loadCatalog(opts.catalogPath);

  // MOC pages own the domain-membership map, so build it from the full corpus
  // (before any --only filter) — a targeted re-import still needs every MOC.
  const domainMembership = buildDomainMembership(allParsed, catalog);
  // Same reasoning: moc-entities.md owns the entity-type membership map, so
  // build it from the full corpus even when --only targets a single slug.
  const entityTypeMembership = buildEntityTypeMembership(allParsed);

  const parsedAll = opts.onlySlug
    ? allParsed.filter((p) => p.source.slug === opts.onlySlug)
    : allParsed;
  if (parsedAll.length === 0) {
    throw new Error(`No wiki file found for slug "${opts.onlySlug}"`);
  }

  return {
    parsedAll,
    slugTitleMap,
    domainMembership,
    entityTypeMembership,
    catalog,
    overrides,
    vaultSlugSet: deriveVaultSlugSet(allParsed),
  };
}

function createSummary(): ImportSummary {
  return {
    articlesWritten: [],
    domainDisagreements: new Map(),
    entityTypeDisagreements: new Map(),
    fallbackDescriptions: [],
    graphPath: null,
    imagesGenerated: [],
    imagesCached: [],
    missingRawSources: new Map(),
    prunedArticles: [],
    searchIndex: null,
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

  // A MOC and a vault-generated page (e.g. the open-questions backlog) are
  // wiki navigation, not editorial prose — they belong in the `Index` kind,
  // kept out of Concept/Essay.
  const isIndexPage = isMocSlug(slug) || parsed.isGenerated;

  // A MOC's/generated page's first content is a `<!-- BEGIN GENERATED -->`
  // marker, so its description must come from the `> Map of Content…`-style
  // blockquote intro rather than the usual first-paragraph fallback.
  const indexDescription = isIndexPage
    ? stripWikilinksToText(firstBlockquote(parsed.body))
    : "";
  const frontmatterSummary = frontmatter.summary?.trim();
  const catalogSummary = ctx.catalog.get(slug)?.summary;
  const rawDescription =
    frontmatterSummary ||
    catalogSummary ||
    indexDescription ||
    stripWikilinksToText(firstParagraph(parsed.body));
  if (!(frontmatterSummary || catalogSummary || indexDescription)) {
    summary.fallbackDescriptions.push(slug);
  }
  const explicitOverride = ctx.overrides[slug];
  const defaultTag: WikiTag =
    source.folder === "concepts" ? "Concept" : "Essay";

  // Always strip the editorial `_Entity._` marker (it also drives the legacy
  // fallback signal); frontmatter `type: entity` is the primary signal now.
  // If the article is otherwise a default-tagged Concept (no explicit
  // override), promote it to Entity. An explicit override wins over
  // everything — that's the manual escape hatch.
  const { description: cleanedDescription, isEntity: hasEntityMarker } =
    detectEntityPrefix(rawDescription);
  const isEntity = isEntityNote(frontmatter.type, hasEntityMarker);
  const tag = resolveTag({
    explicitOverride,
    isIndexPage,
    isEntity,
    defaultTag,
  });

  const tags = normaliseTags(frontmatter.tags);

  // A derived note's own `domain:` is ignored so the catalog row decides it;
  // concepts may still override theirs from frontmatter. Since the catalog
  // became the domain source, this no longer parks essays in `syntheses` —
  // it files them under their catalog domain, leaving the fallback to the
  // `generated: true` pages alone (which is why `syntheses` was dropped from
  // the browsable axis).
  const frontmatterDomain =
    source.folder === "derived" ? undefined : frontmatter.domain;
  const domain = resolveDomain(slug, ctx.domainMembership, frontmatterDomain);
  const mocDomain = ctx.domainMembership.get(slug);
  if (frontmatterDomain && mocDomain && frontmatterDomain !== mocDomain) {
    summary.domainDisagreements.set(slug, {
      frontmatter: frontmatterDomain,
      moc: mocDomain,
    });
  }
  // A concept the vault forgot to file under any MOC lands in `syntheses` by
  // fallback — flag it so the author can curate it into the right domain.
  if (
    source.folder === "concepts" &&
    !isMocSlug(slug) &&
    !ctx.domainMembership.has(slug) &&
    !frontmatterDomain
  ) {
    summary.unmappedConcepts.add(slug);
  }

  const entityType = resolveEntityType(
    slug,
    ctx.entityTypeMembership,
    frontmatter.kind
  );
  const mocEntityType = ctx.entityTypeMembership.get(slug);
  if (frontmatter.kind && mocEntityType && frontmatter.kind !== mocEntityType) {
    summary.entityTypeDisagreements.set(slug, {
      frontmatter: frontmatter.kind,
      moc: mocEntityType,
    });
  }

  const meta: ArticleMeta = {
    date: resolveDate(parsed),
    title,
    description: cleanedDescription,
    readingTime: computeReadingTime(body),
    tag,
    domain,
    ...(entityType ? { entityType } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    ...(sources.length > 0 ? { sources } : {}),
  };

  const imageFile = `${slug}.webp`;
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
  // `$imagegen` only emits PNG, so generation still targets the PNG path and we
  // transcode afterwards. A PNG already sitting there — a pre-WebP import, or a
  // run interrupted between generate and transcode — is reused rather than
  // regenerated, which keeps image-generation quota for genuinely new articles.
  const pngPath = args.imagePath.replace(WEBP_SUFFIX, ".png");
  if (!(await fileExists(pngPath))) {
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
        outputPath: pngPath,
        stagingDir: STAGING_DIR,
        dryRun: args.dryRun,
      });
    } else {
      await generateCodexHeroImage({
        title: args.title,
        body: args.body,
        outputPath: pngPath,
        stagingDir: STAGING_DIR,
        dryRun: args.dryRun,
      });
    }
    // The generators no-op under DRY_RUN, so there is nothing to transcode.
    if (args.dryRun) {
      args.summary.imagesGenerated.push(args.slug);
      return;
    }
  }
  await pngToWebp(pngPath, args.imagePath);
  await rm(pngPath, { force: true });
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
  // Same layout convention as RAW_PATH: the vault's machine-readable catalog
  // lives at `<vault>/_system/catalog.tsv`. Override with CATALOG_PATH when
  // the vault is structured differently.
  const catalogPath = resolve(
    env.CATALOG_PATH ?? join(wikiPath, "..", "_system", "catalog.tsv")
  );
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
    catalogPath,
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
  console.log(
    `Descriptions from first-paragraph fallback: ${summary.fallbackDescriptions.length}`
  );
  console.log(`Images generated: ${summary.imagesGenerated.length}`);
  console.log(`Images cached:    ${summary.imagesCached.length}`);
  if (summary.graphPath) {
    console.log(`Graph:            ${summary.graphPath}`);
  }
  if (summary.searchIndex) {
    console.log(
      `Search index:     ${summary.searchIndex.entryCount} entries → ${summary.searchIndex.outputPath}`
    );
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
  if (summary.domainDisagreements.size > 0) {
    console.log(
      "\nFrontmatter `domain:` disagrees with the catalog row (frontmatter wins):"
    );
    for (const [slug, { frontmatter, moc }] of summary.domainDisagreements) {
      console.log(`  ${slug}: frontmatter=${frontmatter} moc=${moc}`);
    }
  }
  if (summary.entityTypeDisagreements.size > 0) {
    console.log(
      "\nFrontmatter `kind:` disagrees with moc-entities.md (frontmatter wins):"
    );
    for (const [
      slug,
      { frontmatter, moc },
    ] of summary.entityTypeDisagreements) {
      console.log(`  ${slug}: frontmatter=${frontmatter} moc=${moc}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
