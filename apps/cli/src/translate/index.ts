import type { Database } from "bun:sqlite";
import {
  access,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { surfaceHash } from "@howardism/article-contract/surface";
import { runWithConcurrency } from "../concurrency.ts";
import {
  addTerms,
  DEFAULT_ARTICLES_DIR,
  DEFAULT_GLOSSARY_DB_PATH,
  DEFAULT_WIKI_SOURCES_PATH,
  type GlossaryEntry,
  listTerms,
  openDb,
  seedGlossary,
} from "../glossary/store.ts";
import { enforceGlossary } from "./enforce.ts";
import {
  DEFAULT_CODEX_REASONING_EFFORT,
  DEFAULT_CURSOR_MODEL,
  defaultModelForEngine,
  ENGINES,
  type Engine,
  type EngineUsage,
  parseEngine,
  runEngine,
} from "./engines.ts";
import { normalizeHeadings } from "./headings.ts";
import { fixMdxEscaping } from "./postprocess.ts";
import { computeCostUsd, type ModelPrice, resolvePrices } from "./pricing.ts";
import {
  buildStructuredTranslatePrompt,
  buildTranslatePrompt,
  TRANSLATION_OUTPUT_SCHEMA,
} from "./prompt.ts";
import { resyncVerbatimFields, sourceTitle } from "./surface.ts";
import {
  ACTIONABLE_STATUSES,
  classifyArticle,
  type TranslationStatus,
} from "./tracking/classify.ts";
import {
  readProjection,
  recordedHashOf,
  type TranslationProjection,
  type TranslationRecord,
  writeProjection,
} from "./tracking/projection.ts";
import {
  DEFAULT_TRACKING_DB_PATH,
  openTrackingDb,
  recordRuns,
  type TranslationRunInput,
} from "./tracking/store.ts";
import { validateTranslation } from "./validate.ts";

interface RunOptions {
  adopt: boolean;
  check: boolean;
  concurrency: number;
  /** Model passed to `cursor --model` when engine is `cursor`. */
  cursorModel: string;
  dryRun: boolean;
  engine: Engine;
  engineTimeoutMs: number;
  force: boolean;
  glossaryPath: string;
  /** With --check: also print the status buckets as one JSON object on stdout. */
  json: boolean;
  kiroClient: string | undefined;
  /** Cap the number of articles queued per run; null = no limit (all articles). */
  limit: number | null;
  locale: string;
  /** Stop queueing articles once estimated spend reaches this; null = no cap. */
  maxUsd: number | null;
  modelLabel: string | null;
  onlySlug: string | null;
  outputDir: string;
  /** Per-model USD prices from `TRANSLATE_PRICING`; empty when unconfigured. */
  prices: Record<string, ModelPrice>;
  projectionPath: string;
  /** codex `model_reasoning_effort`. */
  reasoningEffort: string;
  scopeDir: string;
  sourceDir: string;
  targetLang: string;
  trackingDbPath: string;
  /** Re-translate stale articles (hash mismatch). Default skips them; --force subsumes this. */
  update: boolean;
  /** With --check: report drift as GitHub ::warning:: annotations and exit 0 instead of failing. */
  warn: boolean;
  wikiSourcesPath: string;
}

interface TranslateSummary {
  /** Never started because `TRANSLATE_MAX_USD` was already reached. */
  budgetSkipped: string[];
  failed: { reason: string; slug: string }[];
  orphans: string[];
  resynced: string[];
  skipped: string[];
  staleSkipped: string[];
  translated: string[];
}

/** Shared, mutating run state. Safe because workers run async in one process. */
interface RunContext {
  /** Open glossary DB; only set while {@link runTranslate} is running. */
  glossaryDb?: Database;
  /** Do-not-translate terms, read once per run. */
  glossaryTerms: string[];
  opts: RunOptions;
  projection: TranslationProjection;
  results: TranslationRunInput[];
  /** Running USD total (engine-reported or estimated) for the budget cap. */
  spentUsd: number;
  summary: TranslateSummary;
  updates: Record<string, TranslationRecord>;
}

const HERE = dirname(new URL(import.meta.url).pathname);
const CLI_ROOT = resolve(HERE, "../../");
const REPO_ROOT = resolve(CLI_ROOT, "../../");
const DEFAULT_OUTPUT_DIR = resolve(
  REPO_ROOT,
  "apps/blog/src/content/articles-zh-TW"
);
const DEFAULT_PROJECTION_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/data/translations.json"
);
const GLOSSARY_SCRIPT_PATH = resolve(CLI_ROOT, "src/glossary/cli.ts");
const MDX_SUFFIX_RE = /\.mdx$/;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_ENGINE_TIMEOUT_MS = 1_800_000; // 30 min per article

/**
 * Source-size ceiling for structured single-turn mode, in bytes. The corpus
 * median is 9.6KB and p90 15KB, but one article is 115KB — a translation that
 * large does not fit comfortably in a single constrained final message, so
 * anything above this ceiling falls back to the agentic file-write path.
 */
export const STRUCTURED_MAX_SOURCE_BYTES = 60_000;

/**
 * Structured mode is codex-only (it needs `--output-schema` + `-o`) and only
 * for sources under {@link STRUCTURED_MAX_SOURCE_BYTES}. It collapses the
 * Read + `glossary list` + Write round-trips — ~11k input tokens of harness
 * overhead each — into one turn.
 */
export function useStructuredMode(engine: Engine, sourceText: string): boolean {
  return (
    engine === "codex" &&
    Buffer.byteLength(sourceText, "utf8") <= STRUCTURED_MAX_SOURCE_BYTES
  );
}

export interface StructuredTranslation {
  mdx: string;
  newTerms: GlossaryEntry[];
}

const isGlossaryEntry = (value: unknown): value is GlossaryEntry => {
  const entry = value as GlossaryEntry | null;
  return (
    !!entry &&
    typeof entry === "object" &&
    typeof entry.term === "string" &&
    entry.term.trim() !== "" &&
    typeof entry.category === "string" &&
    entry.category.trim() !== ""
  );
};

/**
 * Parse codex's structured final message (the `-o` file). Throws a precise
 * Error — unparseable JSON, wrong shape, or an empty `mdx` — so the caller can
 * record it as an attempt failure instead of crashing the run. Malformed
 * `newTerms` entries are dropped rather than failing an otherwise good
 * translation; the glossary is a cache, the MDX is the deliverable.
 */
export function parseStructuredResult(raw: string): StructuredTranslation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `final message is not valid JSON: ${(err as Error).message}`
    );
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("final message JSON is not an object");
  }
  const { mdx, newTerms } = parsed as { mdx?: unknown; newTerms?: unknown };
  if (typeof mdx !== "string" || mdx.trim() === "") {
    throw new Error("final message JSON has no non-empty `mdx` string");
  }
  return {
    mdx,
    newTerms: Array.isArray(newTerms) ? newTerms.filter(isGlossaryEntry) : [],
  };
}

/**
 * Attempt 2's prompt: the brief plus the exact validator errors from attempt 1.
 * A byte-identical retry mostly reproduces the same output, so this corrective
 * block is what makes a second attempt worth paying for.
 */
export function appendRetryFeedback(prompt: string, errors: string[]): string {
  return [
    prompt,
    "",
    "PREVIOUS ATTEMPT REJECTED — the output failed automated validation. Fix exactly these problems and redo the translation:",
    ...errors.map((error) => `- ${error}`),
    "",
    "Everything else in the brief above is unchanged.",
  ].join("\n");
}

async function main(): Promise<void> {
  const opts = parseOptions();

  if (opts.check) {
    await runCheck(opts);
    return;
  }

  console.log("[translate] starting with options:", {
    engine: opts.engine,
    model: opts.modelLabel,
    reasoningEffort: opts.reasoningEffort,
    maxUsd: opts.maxUsd,
    targetLang: opts.targetLang,
    sourceDir: opts.sourceDir,
    outputDir: opts.outputDir,
    projectionPath: opts.projectionPath,
    concurrency: opts.concurrency,
    limit: opts.limit,
    onlySlug: opts.onlySlug,
    force: opts.force,
    update: opts.update,
    dryRun: opts.dryRun,
    adopt: opts.adopt,
  });

  await assertExists(opts.sourceDir, "source dir");
  if (!opts.dryRun) {
    await mkdir(opts.outputDir, { recursive: true });
  }

  const projection = await readProjection(opts.projectionPath, opts.locale);
  const ctx: RunContext = {
    glossaryTerms: [],
    opts,
    projection,
    results: [],
    spentUsd: 0,
    updates: {},
    summary: {
      translated: [],
      skipped: [],
      staleSkipped: [],
      resynced: [],
      orphans: [],
      budgetSkipped: [],
      failed: [],
    },
  };

  if (opts.adopt) {
    await runAdopt(ctx);
  } else {
    await runTranslate(ctx);
  }

  await persist(ctx);
  printSummary(ctx.summary, opts.maxUsd);
  if (ctx.summary.failed.length > 0) {
    process.exitCode = 1;
  }
}

async function runTranslate(ctx: RunContext): Promise<void> {
  const { opts } = ctx;
  await seedGlossary(opts.glossaryPath, {
    articlesDir: opts.sourceDir,
    wikiSourcesPath: opts.wikiSourcesPath,
  });
  // One open handle for the whole run: the terms are inlined into every
  // structured prompt and fed to enforceGlossary, and new terms are upserted
  // back through it.
  const db = openDb(opts.glossaryPath);
  ctx.glossaryDb = db;
  ctx.glossaryTerms = listTerms(db).map((entry) => entry.term);
  try {
    await translateAll(ctx);
  } finally {
    ctx.glossaryDb = undefined;
    db.close();
  }
}

async function translateAll(ctx: RunContext): Promise<void> {
  const { opts } = ctx;
  const slugs = await discoverSlugs(opts.sourceDir, opts.onlySlug);
  if (slugs.length === 0) {
    throw new Error(
      opts.onlySlug
        ? `No source MDX file found for slug "${opts.onlySlug}" in ${opts.sourceDir}`
        : `No *.mdx files found in ${opts.sourceDir}`
    );
  }

  const queued = opts.limit == null ? slugs : slugs.slice(0, opts.limit);
  if (opts.limit != null && queued.length < slugs.length) {
    console.log(
      `[translate] limiting to ${queued.length} of ${slugs.length} articles (--limit ${opts.limit})`
    );
  }

  await runWithConcurrency(queued, opts.concurrency, (slug) =>
    processArticle(slug, ctx)
  );

  // Orphans: a translation lingers but its source slug is gone. Warn only.
  const sourceSet = new Set(slugs);
  for (const slug of await discoverOutputSlugs(opts.outputDir)) {
    if (!sourceSet.has(slug)) {
      ctx.summary.orphans.push(slug);
      console.warn(
        `[translate] orphan ${slug} (translation exists, source removed)`
      );
    }
  }
}

async function processArticle(slug: string, ctx: RunContext): Promise<void> {
  const { opts, projection } = ctx;
  const sourceAbsPath = join(opts.sourceDir, `${slug}.mdx`);
  const outputAbsPath = join(opts.outputDir, `${slug}.mdx`);

  try {
    const sourceText = await readFile(sourceAbsPath, "utf8");
    const outputText = await readFileOrNull(outputAbsPath);
    const status = classifyArticle({
      sourceText,
      outputText,
      recordedHash: recordedHashOf(projection, slug),
    });

    if (!opts.force && status === "fresh") {
      ctx.summary.skipped.push(slug);
      console.log(`[translate] skip ${slug} (fresh)`);
      return;
    }

    if (!(opts.force || opts.update) && status === "stale") {
      ctx.summary.staleSkipped.push(slug);
      console.log(
        `[translate] skip ${slug} (stale — run with --update to refresh)`
      );
      return;
    }

    // A dry run reports the intended action but writes nothing — keep this
    // ahead of the resync branch, which otherwise mutates the output file.
    if (opts.dryRun) {
      const verb =
        !opts.force && status === "verbatim-drift" ? "resync" : "translate";
      console.log(
        `[translate] DRY_RUN — would ${verb} ${slug} (${opts.force ? "force" : status})`
      );
      ctx.summary.skipped.push(slug);
      return;
    }

    if (!opts.force && status === "verbatim-drift" && outputText) {
      await resyncArticle({ slug, sourceText, outputText, outputAbsPath, ctx });
      return;
    }

    // Don't start work we'd have to throw away: once the cap is reached every
    // remaining article is reported as budget-skipped instead of translated.
    if (opts.maxUsd !== null && ctx.spentUsd >= opts.maxUsd) {
      ctx.summary.budgetSkipped.push(slug);
      console.warn(
        `[translate] *** BUDGET CAP REACHED *** skipping ${slug}: estimated spend $${ctx.spentUsd.toFixed(4)} >= TRANSLATE_MAX_USD=$${opts.maxUsd.toFixed(4)}`
      );
      return;
    }

    await translateArticle({
      slug,
      sourceText,
      sourceAbsPath,
      outputAbsPath,
      ctx,
    });
  } catch (err) {
    ctx.summary.failed.push({
      slug,
      reason: `unexpected error: ${(err as Error).message}`,
    });
  }
}

interface ResyncArgs {
  ctx: RunContext;
  outputAbsPath: string;
  outputText: string;
  slug: string;
  sourceText: string;
}

/** Re-copy drifted verbatim frontmatter into the existing translation; no engine. */
async function resyncArticle(args: ResyncArgs): Promise<void> {
  const { slug, sourceText, outputText, outputAbsPath, ctx } = args;
  const next = resyncVerbatimFields(outputText, sourceText);
  if (next !== outputText) {
    await writeFile(outputAbsPath, next, "utf8");
  }
  recordResult(ctx, {
    slug,
    sourceHash: surfaceHash(sourceText),
    sourceTitle: sourceTitle(sourceText),
    engine: "resync",
    model: null,
    durationMs: 0,
  });
  ctx.summary.resynced.push(slug);
  console.log(`[translate] resync ${slug} (verbatim fields)`);
}

interface TranslateArgs {
  ctx: RunContext;
  outputAbsPath: string;
  slug: string;
  sourceAbsPath: string;
  sourceText: string;
}

async function translateArticle(args: TranslateArgs): Promise<void> {
  const { slug, sourceText, sourceAbsPath, outputAbsPath, ctx } = args;
  const { opts } = ctx;
  const structured = useStructuredMode(opts.engine, sourceText);
  const prompt = structured
    ? buildStructuredTranslatePrompt({
        glossaryTerms: ctx.glossaryTerms,
        sourceText,
        targetLang: opts.targetLang,
      })
    : buildTranslatePrompt({
        sourceAbsPath,
        outputAbsPath,
        targetLang: opts.targetLang,
        glossaryCmd: `bun ${GLOSSARY_SCRIPT_PATH}`,
      });
  console.log(
    `[translate] ${slug} path=${structured ? "structured" : "agentic"} (${opts.engine}, source ${Buffer.byteLength(sourceText, "utf8")} bytes)`
  );

  const outcome = await runEngineWithRetry({
    slug,
    sourceAbsPath,
    outputAbsPath,
    prompt,
    structured,
    opts,
  });

  if (!outcome.ok) {
    ctx.summary.failed.push({ slug, reason: outcome.reason });
    return;
  }

  registerNewTerms(ctx, slug, outcome.newTerms);
  await applyGlossary({ ctx, slug, sourceText, outputAbsPath });

  const cost = resolveCost(outcome.usage, opts);
  ctx.spentUsd += cost.costUsd ?? 0;
  recordResult(ctx, {
    slug,
    sourceHash: surfaceHash(sourceText),
    sourceTitle: sourceTitle(sourceText),
    engine: opts.engine,
    model: outcome.usage?.model ?? opts.modelLabel,
    reasoningEffort: opts.engine === "codex" ? opts.reasoningEffort : null,
    costUsd: cost.costUsd,
    costEstimated: cost.estimated,
    credits: outcome.usage?.credits ?? null,
    inputTokens: outcome.usage?.inputTokens ?? null,
    cachedInputTokens: outcome.usage?.cachedInputTokens ?? null,
    outputTokens: outcome.usage?.outputTokens ?? null,
    reasoningOutputTokens: outcome.usage?.reasoningOutputTokens ?? null,
    durationMs: outcome.durationMs,
  });
  ctx.summary.translated.push(slug);
  console.log(
    `[translate] ${slug} ✓ (${(outcome.durationMs / 1000).toFixed(1)}s${
      cost.costUsd == null
        ? ""
        : `, $${cost.costUsd.toFixed(4)}${cost.estimated ? "*" : ""}`
    })`
  );
}

/**
 * USD for one run: an engine-reported cost always wins; otherwise compute one
 * from the configured price table and flag it estimated. Stays null when no
 * price is configured for the model — tokens are recorded either way.
 */
function resolveCost(
  usage: EngineUsage | undefined,
  opts: RunOptions
): { costUsd: number | null; estimated: boolean } {
  if (usage?.costUsd != null) {
    return { costUsd: usage.costUsd, estimated: false };
  }
  const model = usage?.model ?? opts.modelLabel;
  const computed =
    usage && model ? computeCostUsd(usage, opts.prices[model]) : null;
  return { costUsd: computed, estimated: computed !== null };
}

/** Upsert the terms the engine reported as new (structured mode only). */
function registerNewTerms(
  ctx: RunContext,
  slug: string,
  newTerms: GlossaryEntry[]
): void {
  if (!ctx.glossaryDb || newTerms.length === 0) {
    return;
  }
  try {
    const { added } = addTerms(ctx.glossaryDb, newTerms);
    if (added > 0) {
      console.log(
        `[translate] ${slug} glossary: registered ${added} new term(s)`
      );
    }
  } catch (err) {
    // The glossary is a cache; a failed upsert must not fail the article.
    console.warn(
      `[translate] ${slug} glossary upsert failed: ${(err as Error).message}`
    );
  }
}

interface ApplyGlossaryArgs {
  ctx: RunContext;
  outputAbsPath: string;
  slug: string;
  sourceText: string;
}

/**
 * Deterministic post-validation glossary pass: repair the unambiguous cases
 * and report the rest. `missing` is a report, not a gate — the article stays
 * translated.
 */
async function applyGlossary(args: ApplyGlossaryArgs): Promise<void> {
  const { ctx, slug, sourceText, outputAbsPath } = args;
  const outputText = await readFile(outputAbsPath, "utf8");
  const result = enforceGlossary(outputText, sourceText, ctx.glossaryTerms);
  if (result.applied > 0) {
    await writeFile(outputAbsPath, result.text, "utf8");
    console.log(
      `[translate] ${slug} glossary: repaired ${result.applied} link anchor(s)`
    );
  }
  if (result.missing.length > 0) {
    console.warn(
      `[translate] ${slug} glossary: ${result.missing.length} term(s) missing from output: ${result.missing.join(", ")}`
    );
  }
}

/** Record a run for both the history DB (later) and the projection merge. */
function recordResult(ctx: RunContext, run: TranslationRunInput): void {
  const withLocale = { locale: ctx.opts.locale, ...run };
  ctx.results.push(withLocale);
  ctx.updates[run.slug] = {
    sourceHash: run.sourceHash,
    sourceTitle: run.sourceTitle ?? null,
    engine: run.engine,
    model: run.model ?? null,
    costUsd: run.costUsd ?? null,
    costEstimated: run.costEstimated ?? null,
    credits: run.credits ?? null,
    durationMs: run.durationMs,
    translatedAt: new Date().toISOString(),
  };
}

/** Bootstrap: record current source hashes for already-translated, untracked slugs. */
async function runAdopt(ctx: RunContext): Promise<void> {
  const { opts, projection } = ctx;
  const sourceSet = new Set(await discoverSlugs(opts.sourceDir, opts.onlySlug));
  for (const slug of await discoverOutputSlugs(opts.outputDir)) {
    if (opts.onlySlug && slug !== opts.onlySlug) {
      continue;
    }
    if (!sourceSet.has(slug)) {
      ctx.summary.orphans.push(slug);
      console.warn(`[translate] adopt: orphan ${slug} (no source); skipping`);
      continue;
    }
    if (recordedHashOf(projection, slug) !== null) {
      ctx.summary.skipped.push(slug);
      continue;
    }
    const sourceText = await readFile(
      join(opts.sourceDir, `${slug}.mdx`),
      "utf8"
    );
    recordResult(ctx, {
      slug,
      sourceHash: surfaceHash(sourceText),
      sourceTitle: sourceTitle(sourceText),
      engine: "adopt",
      model: null,
      durationMs: 0,
    });
    ctx.summary.translated.push(slug);
    console.log(`[translate] adopt ${slug}`);
  }
}

/** Persist this run: append history to the DB, then merge the committed projection. */
async function persist(ctx: RunContext): Promise<void> {
  if (ctx.opts.dryRun || Object.keys(ctx.updates).length === 0) {
    return;
  }
  try {
    const db = openTrackingDb(ctx.opts.trackingDbPath);
    try {
      recordRuns(db, ctx.results);
    } finally {
      db.close();
    }
  } catch (err) {
    // History cache is best-effort; the committed projection is the truth.
    console.warn(
      `[translate] warning: failed to write history DB: ${(err as Error).message}`
    );
  }
  await writeProjection(ctx.opts.projectionPath, ctx.projection, ctx.updates);
  console.log(`[translate] updated projection: ${ctx.opts.projectionPath}`);
}

/** Check buckets: the status union plus `untranslated` (never-tracked, no output). */
type CheckBuckets = Record<TranslationStatus, string[]> & {
  untranslated: string[];
};

async function runCheck(opts: RunOptions): Promise<void> {
  const projection = await readProjection(opts.projectionPath, opts.locale);
  const sourceSlugs = await discoverSlugs(opts.sourceDir, opts.onlySlug);
  const sourceSet = new Set(sourceSlugs);
  const buckets: CheckBuckets = {
    fresh: [],
    missing: [],
    stale: [],
    "verbatim-drift": [],
    orphan: [],
    untranslated: [],
  };

  for (const slug of sourceSlugs) {
    const sourceText = await readFile(
      join(opts.sourceDir, `${slug}.mdx`),
      "utf8"
    );
    const outputText = await readFileOrNull(
      join(opts.outputDir, `${slug}.mdx`)
    );
    const recordedHash = recordedHashOf(projection, slug);
    const status = classifyArticle({ sourceText, outputText, recordedHash });
    // A never-translated article (no output, no record) is opt-in, not a
    // failure — only TRACKED translations are held to freshness.
    if (status === "missing" && recordedHash === null) {
      buckets.untranslated.push(slug);
    } else {
      buckets[status].push(slug);
    }
  }
  for (const slug of await discoverOutputSlugs(opts.outputDir)) {
    if (!sourceSet.has(slug)) {
      buckets.orphan.push(slug);
    }
  }

  printCheck(opts.locale, buckets, projection);
  if (opts.json) {
    printCheckJson(opts.locale, buckets, projection);
  }

  // Tracked translations that drifted — never untranslated ones. With --warn
  // (CI) report them as GitHub annotations and exit 0; otherwise fail the build.
  const actionable = ACTIONABLE_STATUSES.reduce(
    (n, status) => n + buckets[status].length,
    0
  );
  if (actionable > 0) {
    if (opts.warn) {
      emitCheckWarnings(opts.locale, buckets);
    } else {
      process.exitCode = 1;
    }
  }
}

/** One GitHub Actions `::warning::` per drifted slug — visible on the run, exit 0. */
function emitCheckWarnings(locale: string, buckets: CheckBuckets): void {
  for (const status of ACTIONABLE_STATUSES) {
    for (const slug of buckets[status]) {
      console.log(`::warning::${locale} translation ${status}: ${slug}`);
    }
  }
}

function printCheck(
  locale: string,
  buckets: CheckBuckets,
  projection: TranslationProjection
): void {
  const line = (label: string, slugs: string[]): string => {
    const names =
      slugs.length > 0
        ? `  (${slugs.slice(0, 8).join(", ")}${slugs.length > 8 ? ", …" : ""})`
        : "";
    return `${label.padEnd(15)} ${String(slugs.length).padStart(3)}${names}`;
  };
  const spend = Object.values(projection.articles).reduce(
    (sum, a) => sum + (a.costUsd ?? 0),
    0
  );
  console.log(`=== Translate check (${locale}) ===`);
  console.log(line("Fresh:", buckets.fresh));
  console.log(line("Stale:", buckets.stale));
  console.log(line("Verbatim-drift:", buckets["verbatim-drift"]));
  console.log(line("Missing (tracked):", buckets.missing));
  console.log(line("Orphan:", buckets.orphan));
  console.log(line("Untranslated:", buckets.untranslated));
  console.log(
    `Recorded spend: $${spend.toFixed(4)} across ${Object.keys(projection.articles).length} tracked`
  );
}

/**
 * Machine-readable twin of {@link printCheck}: one compact JSON object on a
 * single line so consumers (e.g. the drip driver) can parse it out of stdout.
 * The `buckets` arrays are the source of truth; counts are their lengths.
 */
function printCheckJson(
  locale: string,
  buckets: CheckBuckets,
  projection: TranslationProjection
): void {
  const spend = Object.values(projection.articles).reduce(
    (sum, a) => sum + (a.costUsd ?? 0),
    0
  );
  console.log(
    JSON.stringify({
      locale,
      buckets,
      spend,
      tracked: Object.keys(projection.articles).length,
    })
  );
}

interface RunEngineWithRetryArgs {
  opts: RunOptions;
  outputAbsPath: string;
  prompt: string;
  slug: string;
  sourceAbsPath: string;
  /** Run codex in structured single-turn mode (`--output-schema` + `-o`). */
  structured: boolean;
}

type EngineOutcome =
  | {
      durationMs: number;
      newTerms: GlossaryEntry[];
      ok: true;
      usage?: EngineUsage;
    }
  | { ok: false; reason: string };

const MAX_ENGINE_ATTEMPTS = 2;

interface EngineAttemptArgs {
  /** Structured mode only: codex `-o` file holding the JSON final message. */
  lastMessagePath: string | undefined;
  opts: RunOptions;
  outputAbsPath: string;
  prompt: string;
  /** Structured mode only: codex `--output-schema` file. */
  schemaPath: string | undefined;
  slug: string;
  sourceAbsPath: string;
}

type AttemptResult =
  | { errors: string[]; ok: false }
  | { newTerms: GlossaryEntry[]; ok: true; usage?: EngineUsage };

/** Spawn the engine for one attempt, logging a heartbeat every 60s. */
async function spawnEngine(
  args: EngineAttemptArgs
): Promise<EngineUsage | undefined> {
  const { slug, prompt, schemaPath, lastMessagePath, opts } = args;
  const startedAt = Date.now();
  const heartbeat = setInterval(() => {
    const elapsedS = ((Date.now() - startedAt) / 1000).toFixed(0);
    console.log(`[translate] ${slug} running… (${elapsedS}s elapsed)`);
  }, 60_000);
  try {
    const { usage } = await runEngine(opts.engine, {
      prompt,
      scopeDir: opts.scopeDir,
      kiroClient: opts.kiroClient,
      cursorModel: opts.cursorModel,
      model: opts.modelLabel ?? undefined,
      reasoningEffort: opts.reasoningEffort,
      outputSchemaPath: schemaPath,
      outputLastMessagePath: lastMessagePath,
      // Pin the agent's glossary subprocess to the SAME absolute DB the
      // orchestrator seeded, regardless of the agent's cwd.
      env: { GLOSSARY_DB_PATH: opts.glossaryPath },
      onStderrLine: (line) => process.stderr.write(`[${slug}] ${line}\n`),
      timeoutMs: opts.engineTimeoutMs,
    });
    return usage;
  } finally {
    clearInterval(heartbeat);
  }
}

/**
 * Deterministic post-processing: normalise headings and fix MDX-breaking escape
 * sequences introduced by the LLM. Both passes are pure and idempotent; the
 * write is skipped when the engine already emitted correct output. A missing
 * file is a no-op — validateTranslation surfaces that precise error.
 */
async function postProcessOutput(outputAbsPath: string): Promise<void> {
  let original: string;
  try {
    original = await readFile(outputAbsPath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw err;
  }
  const normalised = fixMdxEscaping(normalizeHeadings(original));
  if (normalised !== original) {
    await writeFile(outputAbsPath, normalised, "utf8");
  }
}

/** One engine attempt: spawn, materialise output, post-process, validate. */
async function runEngineAttempt(
  args: EngineAttemptArgs
): Promise<AttemptResult> {
  const { sourceAbsPath, outputAbsPath, lastMessagePath } = args;
  let usage: EngineUsage | undefined;
  try {
    usage = await spawnEngine(args);
  } catch (err) {
    return {
      ok: false,
      errors: [`engine spawn failed: ${(err as Error).message}`],
    };
  }

  // Structured mode: the engine wrote nothing — the translation arrives as one
  // JSON final message that we materialise into the output path here.
  let newTerms: GlossaryEntry[] = [];
  if (lastMessagePath) {
    try {
      const parsed = parseStructuredResult(
        await readFile(lastMessagePath, "utf8")
      );
      await writeFile(outputAbsPath, parsed.mdx, "utf8");
      newTerms = parsed.newTerms;
    } catch (err) {
      return {
        ok: false,
        errors: [`structured output unusable: ${(err as Error).message}`],
      };
    }
  }

  try {
    await postProcessOutput(outputAbsPath);
  } catch (err) {
    return {
      ok: false,
      errors: [`post-processing failed: ${(err as Error).message}`],
    };
  }

  const result = await validateTranslation({ sourceAbsPath, outputAbsPath });
  if (!result.ok) {
    return { ok: false, errors: result.errors };
  }
  return { ok: true, newTerms, usage };
}

/** All attempts failed — put the prior translation back so it isn't lost. */
async function restoreExistingOutput(
  slug: string,
  outputAbsPath: string,
  existingOutput: string
): Promise<void> {
  try {
    await writeFile(outputAbsPath, existingOutput, "utf8");
    console.warn(
      `[translate] ${slug} all attempts failed; prior translation restored`
    );
  } catch (err) {
    console.warn(
      `[translate] ${slug} all attempts failed; restore also failed: ${(err as Error).message}`
    );
  }
}

async function runEngineWithRetry(
  args: RunEngineWithRetryArgs
): Promise<EngineOutcome> {
  const { slug, sourceAbsPath, outputAbsPath, prompt, structured, opts } = args;
  const startedAt = Date.now();
  // Preserve the existing translation so we can restore it if all attempts
  // fail — otherwise a timeout or bad output permanently deletes good work.
  const existingOutput = await readFileOrNull(outputAbsPath);
  const tmpDir = structured
    ? await mkdtemp(join(tmpdir(), "translate-structured-"))
    : null;
  const schemaPath = tmpDir ? join(tmpDir, "schema.json") : undefined;
  const lastMessagePath = tmpDir
    ? join(tmpDir, "last-message.json")
    : undefined;
  let lastErrors = ["unknown failure"];
  try {
    if (schemaPath) {
      await writeFile(
        schemaPath,
        JSON.stringify(TRANSLATION_OUTPUT_SCHEMA, null, 2),
        "utf8"
      );
    }
    for (let attempt = 1; attempt <= MAX_ENGINE_ATTEMPTS; attempt += 1) {
      // Clear any prior output before each attempt so an engine that exits 0
      // without rewriting (a no-op) can't pass validation on a stale file.
      await unlinkSilently(outputAbsPath);
      if (lastMessagePath) {
        await unlinkSilently(lastMessagePath);
      }
      console.log(`[translate] ${slug} starting (attempt ${attempt})`);
      const result = await runEngineAttempt({
        lastMessagePath,
        opts,
        outputAbsPath,
        // Attempt 2 gets the previous attempt's validation errors appended.
        prompt:
          attempt === 1 ? prompt : appendRetryFeedback(prompt, lastErrors),
        schemaPath,
        slug,
        sourceAbsPath,
      });
      if (result.ok) {
        return {
          ok: true,
          newTerms: result.newTerms,
          usage: result.usage,
          durationMs: Date.now() - startedAt,
        };
      }
      lastErrors = result.errors;
      console.warn(
        `[translate] ${slug} attempt ${attempt} failed: ${lastErrors.join("; ")}`
      );
      await unlinkSilently(outputAbsPath);
    }
    if (existingOutput) {
      await restoreExistingOutput(slug, outputAbsPath, existingOutput);
    }
    return { ok: false, reason: lastErrors.join("; ") };
  } finally {
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }
}

async function discoverSlugs(
  sourceDir: string,
  onlySlug: string | null
): Promise<string[]> {
  const entries = await readdir(sourceDir);
  const slugs: string[] = [];
  for (const filename of entries) {
    if (!MDX_SUFFIX_RE.test(filename)) {
      continue;
    }
    const slug = filename.replace(MDX_SUFFIX_RE, "");
    if (onlySlug && slug !== onlySlug) {
      continue;
    }
    slugs.push(slug);
  }
  slugs.sort();
  return slugs;
}

async function discoverOutputSlugs(outputDir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(outputDir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
  return entries
    .filter((f) => MDX_SUFFIX_RE.test(f))
    .map((f) => f.replace(MDX_SUFFIX_RE, ""))
    .sort();
}

async function readFileOrNull(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

async function unlinkSilently(path: string): Promise<void> {
  try {
    await unlink(path);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
}

function parseOptions(): RunOptions {
  const env = process.env;
  const argv = process.argv.slice(2);

  const onlyIndex = argv.indexOf("--only");
  let onlySlug: string | null = null;
  if (onlyIndex >= 0) {
    const next = argv[onlyIndex + 1];
    if (!next || next.startsWith("-")) {
      throw new Error(
        "--only requires a slug argument, e.g. --only boris-cherny"
      );
    }
    onlySlug = next;
  }
  const limit = parseLimitOption(argv, env);

  const force = argv.includes("--force") || env.FORCE === "1";
  const update = argv.includes("--update") || env.TRANSLATE_UPDATE === "1";
  const check = argv.includes("--check");
  const json = argv.includes("--json");
  const warn = argv.includes("--warn");
  const adopt = argv.includes("--adopt");
  const dryRun = env.DRY_RUN === "1";

  const engine = parseEngine(env.TRANSLATE_ENGINE ?? "codex");
  const cursorModel =
    env.TRANSLATE_CURSOR_MODEL?.trim() || DEFAULT_CURSOR_MODEL;
  const modelLabel = resolveModelLabel(
    env.TRANSLATE_MODEL,
    engine,
    cursorModel
  );
  const reasoningEffort =
    env.TRANSLATE_REASONING_EFFORT?.trim() || DEFAULT_CODEX_REASONING_EFFORT;
  const maxUsd = parseMaxUsd(env.TRANSLATE_MAX_USD);
  const prices = resolvePrices(env);
  const targetLang = env.TARGET_LANG ?? "zh-TW";

  const sourceDir = resolve(env.TRANSLATE_SOURCE_PATH ?? DEFAULT_ARTICLES_DIR);
  const outputDir = resolve(env.TRANSLATE_OUTPUT_PATH ?? DEFAULT_OUTPUT_DIR);
  const glossaryPath = resolve(
    env.GLOSSARY_DB_PATH ?? DEFAULT_GLOSSARY_DB_PATH
  );
  const wikiSourcesPath = resolve(
    env.WIKI_SOURCES_PATH ?? DEFAULT_WIKI_SOURCES_PATH
  );
  const projectionPath = resolve(
    env.TRANSLATE_PROJECTION_PATH ?? DEFAULT_PROJECTION_PATH
  );
  const trackingDbPath = resolve(
    env.TRANSLATE_TRACKING_DB_PATH ?? DEFAULT_TRACKING_DB_PATH
  );

  const concurrency = parseConcurrency(env.TRANSLATE_CONCURRENCY);
  const engineTimeoutMs = parseTimeoutMs(env.TRANSLATE_ENGINE_TIMEOUT_MS);
  const kiroClient = env.KIRO_ACP_CLIENT
    ? resolve(env.KIRO_ACP_CLIENT)
    : undefined;

  // Engine config is only needed when we actually translate (not for --check).
  if (!(check || adopt) && engine === "kiro" && !kiroClient) {
    throw new Error(
      "KIRO_ACP_CLIENT is not set. Set it to the absolute path of your kiro-acp.py client to use the `kiro` engine."
    );
  }

  return {
    adopt,
    check,
    concurrency,
    cursorModel,
    dryRun,
    engine,
    engineTimeoutMs,
    force,
    glossaryPath,
    json,
    kiroClient,
    limit,
    locale: targetLang,
    maxUsd,
    modelLabel,
    onlySlug,
    outputDir,
    prices,
    projectionPath,
    reasoningEffort,
    scopeDir: REPO_ROOT,
    sourceDir,
    targetLang,
    trackingDbPath,
    update,
    warn,
    wikiSourcesPath,
  };
}

/**
 * Resolve the model actually requested (and the telemetry label — they are the
 * same thing). An explicit `TRANSLATE_MODEL` always wins; cursor's is
 * separately overridable via `TRANSLATE_CURSOR_MODEL`; everything else falls
 * back to the engine's own default (codex → `gpt-5.6-luna`, null for engines
 * with no configurable model).
 */
function resolveModelLabel(
  raw: string | undefined,
  engine: Engine,
  cursorModel: string
): string | null {
  const explicit = raw?.trim();
  if (explicit) {
    return explicit;
  }
  return engine === "cursor" ? cursorModel : defaultModelForEngine(engine);
}

function parseMaxUsd(raw: string | undefined): number | null {
  if (!raw?.trim()) {
    return null;
  }
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(
      `TRANSLATE_MAX_USD must be a non-negative number (got "${raw}")`
    );
  }
  return n;
}

function parseConcurrency(raw: string | undefined): number {
  if (!raw) {
    return DEFAULT_CONCURRENCY;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(
      `TRANSLATE_CONCURRENCY must be a positive integer (got "${raw}")`
    );
  }
  return n;
}

function parseLimit(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(
      `--limit / TRANSLATE_LIMIT must be a positive integer (got "${raw}")`
    );
  }
  return n;
}

function parseLimitOption(
  argv: string[],
  env: NodeJS.ProcessEnv
): number | null {
  const idx = argv.indexOf("--limit");
  if (idx >= 0) {
    const next = argv[idx + 1];
    if (!next || next.startsWith("-")) {
      throw new Error("--limit requires a positive integer, e.g. --limit 5");
    }
    return parseLimit(next);
  }
  return env.TRANSLATE_LIMIT ? parseLimit(env.TRANSLATE_LIMIT) : null;
}

function parseTimeoutMs(raw: string | undefined): number {
  if (!raw) {
    return DEFAULT_ENGINE_TIMEOUT_MS;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(
      `TRANSLATE_ENGINE_TIMEOUT_MS must be a non-negative integer (got "${raw}")`
    );
  }
  return n;
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

function printSummary(summary: TranslateSummary, maxUsd: number | null): void {
  console.log("\n=== Translate summary ===");
  console.log(`Translated:     ${summary.translated.length}`);
  console.log(`Resynced:       ${summary.resynced.length}`);
  console.log(`Skipped:        ${summary.skipped.length}`);
  console.log(
    `Stale-skipped:  ${summary.staleSkipped.length}${summary.staleSkipped.length > 0 ? " (run with --update to refresh)" : ""}`
  );
  console.log(
    `Budget-skipped: ${summary.budgetSkipped.length}${summary.budgetSkipped.length > 0 ? ` (TRANSLATE_MAX_USD=$${(maxUsd ?? 0).toFixed(4)} reached — raise the cap to continue)` : ""}`
  );
  console.log(`Orphans:        ${summary.orphans.length}`);
  console.log(`Failed:         ${summary.failed.length}`);
  if (summary.budgetSkipped.length > 0) {
    console.log(`\nBudget-skipped: ${summary.budgetSkipped.join(", ")}`);
  }
  if (summary.failed.length > 0) {
    console.log("\nFailures:");
    for (const { slug, reason } of summary.failed) {
      console.log(`  ${slug} → ${reason}`);
    }
  }
  console.log(
    `\nEngines available: ${ENGINES.join(", ")} (default: codex via TRANSLATE_ENGINE)`
  );
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
