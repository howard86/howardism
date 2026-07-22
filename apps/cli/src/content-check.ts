/**
 * Content-integrity gate for the wiki-generated blog. Runs locally and in CI
 * (see `.github/workflows/ci.yml`). Type-check alone happily passes when hero
 * PNGs are missing or the link graph points at deleted articles — a real
 * incident shipped 30 missing images with exit 0 — so this script is the
 * enforced check that those never reach `main`.
 *
 *   bun apps/cli/src/content-check.ts   # exit 1 if any FAILURE, else 0
 *
 * FAILURES (exit 1): hero-image imports that resolve to a real PNG, every slug
 * referenced by the committed manifests existing as an article, required
 * frontmatter (`title`, `description`, `imageAlt`) being present, the
 * `syntheses` fallback domain staying under a third of all articles, and
 * every curated domain owning at least one article.
 *
 * WARNINGS (never affect exit code; emitted as GitHub `::warning::` annotations
 * under CI): orphan articles with no backlinks, domains without a `moc-<domain>`
 * "start here" article, and orphan PNGs with no article. These are editorial
 * signals, not build breakers.
 *
 * The check functions are pure and unit-tested against small in-memory
 * fixtures; only `main` touches the filesystem.
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { WIKI_DOMAINS } from "@howardism/article-contract";
import type { ArticleGraph } from "@howardism/article-contract/manifests/graph";
import type { OpenQuestionsManifest } from "@howardism/article-contract/manifests/open-questions";
import type { WikiSourcesManifest } from "@howardism/article-contract/manifests/wiki-sources";
import matter from "gray-matter";

const HERE = dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = resolve(HERE, "../../../");
const ARTICLES_DIR = resolve(REPO_ROOT, "apps/blog/src/content/articles");
const ASSETS_DIR = resolve(REPO_ROOT, "apps/blog/src/content/assets");
const DATA_DIR = resolve(REPO_ROOT, "apps/blog/src/data");

const MDX_SUFFIX = /\.mdx$/;
const PNG_SUFFIX = /\.png$/;
const MOC_PREFIX = "moc-";
/** Catch-all domain for notes no MOC claims. */
const FALLBACK_DOMAIN = "syntheses";
/**
 * `syntheses` normally holds ~10% of articles (25-30 of ~278). A vault-side
 * taxonomy rename once made every unclaimed concept silently fall into it
 * instead, pushing it to 64% (178 of 278) while import still exited 0. A
 * third leaves wide margin on both sides.
 */
const SYNTHESES_FALLBACK_CEILING = 1 / 3;
// The `export { default as heroImage } from "../assets/<file>.png";` line every
// emitted MDX carries after its frontmatter. Capture the referenced filename.
const HERO_IMPORT_RE =
  /export\s*\{\s*default as heroImage\s*\}\s*from\s*["']\.\.\/assets\/([^"']+)["']/;

/** One article reduced to just the fields the integrity checks need. */
export interface ArticleRecord {
  description: string;
  domain: string | null;
  /** hero PNG filename from the import line (e.g. `foo.png`), or null if absent. */
  heroImage: string | null;
  imageAlt: string;
  slug: string;
  title: string;
}

/** Extract the hero-image filename from raw MDX, or null when no import line. */
export function extractHeroImage(raw: string): string | null {
  return raw.match(HERO_IMPORT_RE)?.[1] ?? null;
}

/** Parse one MDX article's raw source into an {@link ArticleRecord}. */
export function parseArticle(raw: string, slug: string): ArticleRecord {
  const { data } = matter(raw);
  return {
    slug,
    title: String(data.title ?? "").trim(),
    description: String(data.description ?? "").trim(),
    imageAlt: String(data.imageAlt ?? "").trim(),
    domain: data.domain ? String(data.domain) : null,
    heroImage: extractHeroImage(raw),
  };
}

// ---- FAILURE checks: return one message per broken invariant ----

/** Every article must import a hero image that exists in the assets dir. */
export function checkHeroImages(
  articles: ArticleRecord[],
  assetFilenames: Set<string>
): string[] {
  const failures: string[] = [];
  for (const article of articles) {
    if (article.heroImage === null) {
      failures.push(`${article.slug}: no heroImage import line`);
    } else if (!assetFilenames.has(article.heroImage)) {
      failures.push(
        `${article.slug}: hero image "${article.heroImage}" not found in assets/`
      );
    }
  }
  return failures;
}

/** Every slug used as a key or value in the link graph must be a real article. */
export function checkGraphSlugRefs(
  graph: ArticleGraph,
  articleSlugs: Set<string>
): string[] {
  const failures: string[] = [];
  for (const relation of ["backlinks", "outgoing", "related"] as const) {
    for (const [source, targets] of Object.entries(graph[relation] ?? {})) {
      if (!articleSlugs.has(source)) {
        failures.push(`graph.${relation} key "${source}" has no article`);
      }
      for (const target of targets) {
        if (!articleSlugs.has(target)) {
          failures.push(
            `graph.${relation}["${source}"] → "${target}" has no article`
          );
        }
      }
    }
  }
  return failures;
}

/** Every concept slug in the open-questions manifest must be a real article. */
export function checkOpenQuestionSlugRefs(
  manifest: OpenQuestionsManifest,
  articleSlugs: Set<string>
): string[] {
  const failures: string[] = [];
  for (const concept of manifest.byConcept ?? []) {
    if (!articleSlugs.has(concept.slug)) {
      failures.push(`open-questions concept "${concept.slug}" has no article`);
    }
  }
  return failures;
}

/** Every `citedBy` slug in the wiki-sources manifest must be a real article. */
export function checkWikiSourceSlugRefs(
  manifest: WikiSourcesManifest,
  articleSlugs: Set<string>
): string[] {
  const failures: string[] = [];
  for (const source of manifest.sources ?? []) {
    for (const slug of source.citedBy ?? []) {
      if (!articleSlugs.has(slug)) {
        failures.push(
          `wiki-sources "${source.title}" citedBy "${slug}" has no article`
        );
      }
    }
  }
  return failures;
}

/** Required frontmatter must be present and non-empty on every article. */
export function checkFrontmatter(articles: ArticleRecord[]): string[] {
  const failures: string[] = [];
  for (const article of articles) {
    const missing = (["title", "description", "imageAlt"] as const).filter(
      (field) => article[field].length === 0
    );
    if (missing.length > 0) {
      failures.push(`${article.slug}: missing ${missing.join(", ")}`);
    }
  }
  return failures;
}

/** domain → article count, descending, for reporting a distribution failure. */
function domainCounts(articles: ArticleRecord[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const { domain } of articles) {
    if (domain) {
      counts.set(domain, (counts.get(domain) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/** `domain: count` lines, descending, so a failure shows the whole shape. */
function formatDistribution(articles: ArticleRecord[]): string[] {
  return domainCounts(articles).map(([domain, count]) => `${domain}: ${count}`);
}

/**
 * `syntheses` is the fallback domain for notes no MOC claims. If it holds
 * more than a third of all articles, something upstream is silently dumping
 * notes into it instead of resolving their real domain — see
 * {@link SYNTHESES_FALLBACK_CEILING}.
 */
export function checkFallbackCeiling(articles: ArticleRecord[]): string[] {
  if (articles.length === 0) {
    return [];
  }
  const fallbackCount = articles.filter(
    (a) => a.domain === FALLBACK_DOMAIN
  ).length;
  if (fallbackCount / articles.length <= SYNTHESES_FALLBACK_CEILING) {
    return [];
  }
  const pct = Math.round((fallbackCount / articles.length) * 100);
  const ceilingPct = Math.round(SYNTHESES_FALLBACK_CEILING * 100);
  return [
    `${FALLBACK_DOMAIN} holds ${fallbackCount}/${articles.length} articles (${pct}%), over the ${ceilingPct}% ceiling`,
    ...formatDistribution(articles),
  ];
}

/**
 * Every curated domain other than the `syntheses` fallback must own at least
 * one article. Zero means its MOC vanished or stopped resolving.
 */
export function checkEmptyDomains(articles: ArticleRecord[]): string[] {
  const counts = new Map(domainCounts(articles));
  const empty = WIKI_DOMAINS.filter(
    (domain) => domain !== FALLBACK_DOMAIN && !counts.get(domain)
  );
  if (empty.length === 0) {
    return [];
  }
  return [
    ...empty.map((domain) => `${domain}: 0 articles`),
    ...formatDistribution(articles),
  ];
}

// ---- WARNING checks: editorial signals, never fail the build ----

/**
 * Articles no other article links to are dead ends for readers. MOC ("start
 * here") pages are entry points by design and exempt.
 */
export function findOrphanArticles(
  articles: ArticleRecord[],
  backlinks: Record<string, string[]>
): string[] {
  const orphans: string[] = [];
  for (const { slug } of articles) {
    if (slug.startsWith(MOC_PREFIX)) {
      continue;
    }
    if ((backlinks[slug]?.length ?? 0) === 0) {
      orphans.push(slug);
    }
  }
  return orphans;
}

/**
 * Domains without a `moc-<domain>` article have no curated spine — the domain
 * page falls back to a bare date-sorted table.
 */
export function findDomainsWithoutMoc(articles: ArticleRecord[]): string[] {
  const slugs = new Set(articles.map((a) => a.slug));
  const domains = new Set<string>();
  for (const { domain } of articles) {
    if (domain) {
      domains.add(domain);
    }
  }
  return [...domains]
    .filter((domain) => !slugs.has(`${MOC_PREFIX}${domain}`))
    .sort();
}

/** PNGs in assets/ with no article that imports them — dead weight. */
export function findOrphanPngs(
  assetFilenames: Set<string>,
  articleSlugs: Set<string>
): string[] {
  const orphans: string[] = [];
  for (const filename of assetFilenames) {
    const slug = filename.replace(PNG_SUFFIX, "");
    if (!articleSlugs.has(slug)) {
      orphans.push(filename);
    }
  }
  return orphans.sort();
}

// ---- Orchestration (filesystem I/O lives only below this line) ----

interface CheckResult {
  messages: string[];
  name: string;
}

async function readMdxSlugs(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries
    .filter((name) => MDX_SUFFIX.test(name))
    .map((name) => name.replace(MDX_SUFFIX, ""))
    .sort();
}

async function loadArticles(): Promise<ArticleRecord[]> {
  const slugs = await readMdxSlugs(ARTICLES_DIR);
  const articles: ArticleRecord[] = [];
  for (const slug of slugs) {
    const raw = await readFile(resolve(ARTICLES_DIR, `${slug}.mdx`), "utf8");
    articles.push(parseArticle(raw, slug));
  }
  return articles;
}

async function loadAssetFilenames(): Promise<Set<string>> {
  const entries = await readdir(ASSETS_DIR);
  return new Set(entries.filter((name) => PNG_SUFFIX.test(name)));
}

async function loadJson<T>(filename: string): Promise<T> {
  const raw = await readFile(resolve(DATA_DIR, filename), "utf8");
  return JSON.parse(raw) as T;
}

function printResults(title: string, results: CheckResult[]): void {
  console.log(`\n${title}`);
  for (const { name, messages } of results) {
    console.log(`  ${name.padEnd(24)} ${String(messages.length).padStart(4)}`);
    for (const message of messages) {
      console.log(`      ${message}`);
    }
  }
}

/** One `::warning::` per warning message so CI surfaces them as annotations. */
function emitWarningAnnotations(results: CheckResult[]): void {
  for (const { name, messages } of results) {
    for (const message of messages) {
      console.log(`::warning::[content-check] ${name}: ${message}`);
    }
  }
}

async function main(): Promise<void> {
  const [articles, assetFilenames, graph, openQuestions, wikiSources] =
    await Promise.all([
      loadArticles(),
      loadAssetFilenames(),
      loadJson<ArticleGraph>("article-graph.json"),
      loadJson<OpenQuestionsManifest>("open-questions.json"),
      loadJson<WikiSourcesManifest>("wiki-sources.json"),
    ]);
  const articleSlugs = new Set(articles.map((a) => a.slug));

  const failures: CheckResult[] = [
    {
      name: "hero-images",
      messages: checkHeroImages(articles, assetFilenames),
    },
    {
      name: "graph-slug-refs",
      messages: checkGraphSlugRefs(graph, articleSlugs),
    },
    {
      name: "open-question-slug-refs",
      messages: checkOpenQuestionSlugRefs(openQuestions, articleSlugs),
    },
    {
      name: "wiki-source-slug-refs",
      messages: checkWikiSourceSlugRefs(wikiSources, articleSlugs),
    },
    { name: "frontmatter-required", messages: checkFrontmatter(articles) },
    {
      name: "domain-fallback-ceiling",
      messages: checkFallbackCeiling(articles),
    },
    { name: "empty-domains", messages: checkEmptyDomains(articles) },
  ];
  const warnings: CheckResult[] = [
    {
      name: "orphan-articles",
      messages: findOrphanArticles(articles, graph.backlinks ?? {}),
    },
    {
      name: "domains-without-moc",
      messages: findDomainsWithoutMoc(articles),
    },
    {
      name: "orphan-pngs",
      messages: findOrphanPngs(assetFilenames, articleSlugs),
    },
  ];

  const failCount = failures.reduce((n, r) => n + r.messages.length, 0);
  const warnCount = warnings.reduce((n, r) => n + r.messages.length, 0);

  console.log("=== Content integrity check ===");
  console.log(`Articles: ${articles.length}   Assets: ${assetFilenames.size}`);
  printResults("FAILURES", failures);
  printResults("WARNINGS", warnings);

  if (process.env.GITHUB_ACTIONS) {
    emitWarningAnnotations(warnings);
  }

  console.log(
    `\nResult: ${failCount === 0 ? "PASS" : "FAIL"} (${failCount} failure${
      failCount === 1 ? "" : "s"
    }, ${warnCount} warning${warnCount === 1 ? "" : "s"})`
  );

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
