import {
  access,
  mkdir,
  readdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { surfaceHash } from "@howardism/article-contract/surface";
import { runWithConcurrency } from "../concurrency.ts";
import {
  DEFAULT_ARTICLES_DIR,
  DEFAULT_GLOSSARY_DB_PATH,
  DEFAULT_WIKI_SOURCES_PATH,
  seedGlossary,
} from "../glossary/store.ts";
import {
  DEFAULT_CURSOR_MODEL,
  ENGINES,
  type Engine,
  type EngineUsage,
  parseEngine,
  runEngine,
} from "./engines.ts";
import { normalizeHeadings } from "./headings.ts";
import { fixMdxEscaping } from "./postprocess.ts";
import { buildTranslatePrompt } from "./prompt.ts";
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
  kiroClient: string | undefined;
  /** Cap the number of articles queued per run; null = no limit (all articles). */
  limit: number | null;
  locale: string;
  modelLabel: string | null;
  onlySlug: string | null;
  outputDir: string;
  projectionPath: string;
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
  failed: { reason: string; slug: string }[];
  orphans: string[];
  resynced: string[];
  skipped: string[];
  staleSkipped: string[];
  translated: string[];
}

/** Shared, mutating run state. Safe because workers run async in one process. */
interface RunContext {
  opts: RunOptions;
  projection: TranslationProjection;
  results: TranslationRunInput[];
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

async function main(): Promise<void> {
  const opts = parseOptions();

  if (opts.check) {
    await runCheck(opts);
    return;
  }

  console.log("[translate] starting with options:", {
    engine: opts.engine,
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
    opts,
    projection,
    results: [],
    updates: {},
    summary: {
      translated: [],
      skipped: [],
      staleSkipped: [],
      resynced: [],
      orphans: [],
      failed: [],
    },
  };

  if (opts.adopt) {
    await runAdopt(ctx);
  } else {
    await runTranslate(ctx);
  }

  await persist(ctx);
  printSummary(ctx.summary);
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
  const glossaryCmd = `bun ${GLOSSARY_SCRIPT_PATH}`;
  const prompt = buildTranslatePrompt({
    sourceAbsPath,
    outputAbsPath,
    targetLang: opts.targetLang,
    glossaryCmd,
  });

  const outcome = await runEngineWithRetry({
    slug,
    sourceAbsPath,
    outputAbsPath,
    prompt,
    opts,
  });

  if (!outcome.ok) {
    ctx.summary.failed.push({ slug, reason: outcome.reason });
    return;
  }

  recordResult(ctx, {
    slug,
    sourceHash: surfaceHash(sourceText),
    sourceTitle: sourceTitle(sourceText),
    engine: opts.engine,
    model: outcome.usage?.model ?? opts.modelLabel,
    costUsd: outcome.usage?.costUsd ?? null,
    credits: outcome.usage?.credits ?? null,
    inputTokens: outcome.usage?.inputTokens ?? null,
    outputTokens: outcome.usage?.outputTokens ?? null,
    durationMs: outcome.durationMs,
  });
  ctx.summary.translated.push(slug);
  console.log(
    `[translate] ${slug} ✓ (${(outcome.durationMs / 1000).toFixed(1)}s${
      outcome.usage?.costUsd == null
        ? ""
        : `, $${outcome.usage.costUsd.toFixed(4)}`
    })`
  );
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

interface RunEngineWithRetryArgs {
  opts: RunOptions;
  outputAbsPath: string;
  prompt: string;
  slug: string;
  sourceAbsPath: string;
}

type EngineOutcome =
  | { durationMs: number; ok: true; usage?: EngineUsage }
  | { ok: false; reason: string };

const MAX_ENGINE_ATTEMPTS = 2;

async function runEngineWithRetry(
  args: RunEngineWithRetryArgs
): Promise<EngineOutcome> {
  const { slug, sourceAbsPath, outputAbsPath, prompt, opts } = args;
  const startedAt = Date.now();
  // Preserve the existing translation so we can restore it if all attempts
  // fail — otherwise a timeout or bad output permanently deletes good work.
  const existingOutput = await readFileOrNull(outputAbsPath);
  let lastReason = "unknown failure";
  let lastUsage: EngineUsage | undefined;
  for (let attempt = 1; attempt <= MAX_ENGINE_ATTEMPTS; attempt += 1) {
    // Clear any prior output before each attempt so an engine that exits 0
    // without rewriting (a no-op) can't pass validation on a stale file.
    await unlinkSilently(outputAbsPath);
    console.log(`[translate] ${slug} starting (attempt ${attempt})`);
    const attemptStartedAt = Date.now();
    const heartbeat = setInterval(() => {
      const elapsedS = ((Date.now() - attemptStartedAt) / 1000).toFixed(0);
      console.log(`[translate] ${slug} running… (${elapsedS}s elapsed)`);
    }, 60_000);
    try {
      const { usage } = await runEngine(opts.engine, {
        prompt,
        scopeDir: opts.scopeDir,
        kiroClient: opts.kiroClient,
        cursorModel: opts.cursorModel,
        // Pin the agent's glossary subprocess to the SAME absolute DB the
        // orchestrator seeded, regardless of the agent's cwd.
        env: { GLOSSARY_DB_PATH: opts.glossaryPath },
        onStderrLine: (line) => process.stderr.write(`[${slug}] ${line}\n`),
        timeoutMs: opts.engineTimeoutMs,
      });
      lastUsage = usage;
    } catch (err) {
      lastReason = `engine spawn failed: ${(err as Error).message}`;
      console.warn(
        `[translate] ${slug} attempt ${attempt} engine error: ${lastReason}`
      );
      await unlinkSilently(outputAbsPath);
      continue;
    } finally {
      clearInterval(heartbeat);
    }

    // Deterministic post-processing: normalise headings and fix MDX-breaking
    // escape sequences introduced by the LLM. Both passes are pure and
    // idempotent. Skip the write when the engine already emitted correct
    // output. A missing file here means the engine exited 0 without writing —
    // let validateTranslation surface that precise error.
    try {
      const original = await readFile(outputAbsPath, "utf8");
      const normalised = fixMdxEscaping(normalizeHeadings(original));
      if (normalised !== original) {
        await writeFile(outputAbsPath, normalised, "utf8");
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        lastReason = `post-processing failed: ${(err as Error).message}`;
        console.warn(`[translate] ${slug} attempt ${attempt} ${lastReason}`);
        await unlinkSilently(outputAbsPath);
        continue;
      }
    }

    const result = await validateTranslation({ sourceAbsPath, outputAbsPath });
    if (result.ok) {
      return { ok: true, usage: lastUsage, durationMs: Date.now() - startedAt };
    }
    lastReason = result.errors.join("; ");
    console.warn(
      `[translate] ${slug} attempt ${attempt} validation failed: ${lastReason}`
    );
    await unlinkSilently(outputAbsPath);
  }
  // All attempts failed — restore the prior translation so it isn't lost.
  if (existingOutput) {
    try {
      await writeFile(outputAbsPath, existingOutput, "utf8");
      console.warn(
        `[translate] ${slug} all attempts failed; prior translation restored`
      );
    } catch (restoreErr) {
      console.warn(
        `[translate] ${slug} all attempts failed; restore also failed: ${(restoreErr as Error).message}`
      );
    }
  }
  return { ok: false, reason: lastReason };
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
  const warn = argv.includes("--warn");
  const adopt = argv.includes("--adopt");
  const dryRun = env.DRY_RUN === "1";

  const engine = parseEngine(env.TRANSLATE_ENGINE ?? "agy");
  const cursorModel =
    env.TRANSLATE_CURSOR_MODEL?.trim() || DEFAULT_CURSOR_MODEL;
  const modelLabel = resolveModelLabel(
    env.TRANSLATE_MODEL,
    engine,
    cursorModel
  );
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
    kiroClient,
    limit,
    locale: targetLang,
    modelLabel,
    onlySlug,
    outputDir,
    projectionPath,
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
 * Resolve the telemetry model label. An explicit `TRANSLATE_MODEL` always wins;
 * otherwise cursor reports tokens but no model name, so fall back to the
 * configured cursor model. Other engines either report their own model or leave
 * it null.
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
  return engine === "cursor" ? cursorModel : null;
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

function printSummary(summary: TranslateSummary): void {
  console.log("\n=== Translate summary ===");
  console.log(`Translated:     ${summary.translated.length}`);
  console.log(`Resynced:       ${summary.resynced.length}`);
  console.log(`Skipped:        ${summary.skipped.length}`);
  console.log(
    `Stale-skipped:  ${summary.staleSkipped.length}${summary.staleSkipped.length > 0 ? " (run with --update to refresh)" : ""}`
  );
  console.log(`Orphans:        ${summary.orphans.length}`);
  console.log(`Failed:         ${summary.failed.length}`);
  if (summary.failed.length > 0) {
    console.log("\nFailures:");
    for (const { slug, reason } of summary.failed) {
      console.log(`  ${slug} → ${reason}`);
    }
  }
  console.log(
    `\nEngines available: ${ENGINES.join(", ")} (default: agy via TRANSLATE_ENGINE)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
