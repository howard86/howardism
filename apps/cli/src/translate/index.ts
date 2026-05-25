import {
  access,
  mkdir,
  readdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { runWithConcurrency } from "../concurrency.ts";
import {
  DEFAULT_ARTICLES_DIR,
  DEFAULT_GLOSSARY_DB_PATH,
  DEFAULT_WIKI_SOURCES_PATH,
  seedGlossary,
} from "../glossary/store.ts";
import { ENGINES, type Engine, parseEngine, runEngine } from "./engines.ts";
import { normalizeHeadings } from "./headings.ts";
import { buildTranslatePrompt } from "./prompt.ts";
import { validateTranslation } from "./validate.ts";

interface RunOptions {
  concurrency: number;
  dryRun: boolean;
  engine: Engine;
  engineTimeoutMs: number;
  force: boolean;
  glossaryPath: string;
  kiroClient: string | undefined;
  onlySlug: string | null;
  outputDir: string;
  scopeDir: string;
  sourceDir: string;
  targetLang: string;
  wikiSourcesPath: string;
}

interface TranslateSummary {
  failed: { reason: string; slug: string }[];
  skipped: string[];
  translated: string[];
}

interface FailureRecord {
  reason: string;
  slug: string;
}

const HERE = dirname(new URL(import.meta.url).pathname);
const CLI_ROOT = resolve(HERE, "../../");
const REPO_ROOT = resolve(CLI_ROOT, "../../");
const DEFAULT_OUTPUT_DIR = resolve(
  REPO_ROOT,
  "apps/blog/src/content/articles-zh-TW"
);
const GLOSSARY_SCRIPT_PATH = resolve(CLI_ROOT, "src/glossary/cli.ts");
const MDX_SUFFIX_RE = /\.mdx$/;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_ENGINE_TIMEOUT_MS = 1_800_000; // 30 min per article

async function main(): Promise<void> {
  const opts = parseOptions();
  console.log("[translate] starting with options:", {
    engine: opts.engine,
    targetLang: opts.targetLang,
    sourceDir: opts.sourceDir,
    outputDir: opts.outputDir,
    glossaryPath: opts.glossaryPath,
    concurrency: opts.concurrency,
    onlySlug: opts.onlySlug,
    force: opts.force,
    dryRun: opts.dryRun,
  });

  await assertExists(opts.sourceDir, "source dir");
  if (!opts.dryRun) {
    await mkdir(opts.outputDir, { recursive: true });
  }

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

  const summary: TranslateSummary = {
    translated: [],
    skipped: [],
    failed: [],
  };

  await runWithConcurrency(slugs, opts.concurrency, (slug) =>
    processArticle(slug, opts, summary)
  );

  printSummary(summary);
  if (summary.failed.length > 0) {
    process.exitCode = 1;
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

async function processArticle(
  slug: string,
  opts: RunOptions,
  summary: TranslateSummary
): Promise<void> {
  const sourceAbsPath = join(opts.sourceDir, `${slug}.mdx`);
  const outputAbsPath = join(opts.outputDir, `${slug}.mdx`);

  if (!opts.force && (await fileExists(outputAbsPath))) {
    summary.skipped.push(slug);
    console.log(`[translate] skip ${slug} (output exists; --force to retry)`);
    return;
  }

  if (opts.dryRun) {
    console.log(
      `[translate] DRY_RUN — would translate ${sourceAbsPath} → ${outputAbsPath}`
    );
    summary.skipped.push(slug);
    return;
  }

  // Isolate every article: an unexpected throw (e.g. a malformed source, a
  // filesystem error during cleanup) must fail THIS slug, not reject the
  // runWithConcurrency worker and abort the whole batch.
  try {
    const glossaryCmd = `bun ${GLOSSARY_SCRIPT_PATH}`;
    const prompt = buildTranslatePrompt({
      sourceAbsPath,
      outputAbsPath,
      targetLang: opts.targetLang,
      glossaryCmd,
    });

    const failure = await runEngineWithRetry({
      slug,
      sourceAbsPath,
      outputAbsPath,
      prompt,
      opts,
    });

    if (failure) {
      summary.failed.push(failure);
      return;
    }

    summary.translated.push(slug);
    console.log(`[translate] ${slug} ✓`);
  } catch (err) {
    summary.failed.push({
      slug,
      reason: `unexpected error: ${(err as Error).message}`,
    });
  }
}

interface RunEngineWithRetryArgs {
  opts: RunOptions;
  outputAbsPath: string;
  prompt: string;
  slug: string;
  sourceAbsPath: string;
}

const MAX_ENGINE_ATTEMPTS = 2;

async function runEngineWithRetry(
  args: RunEngineWithRetryArgs
): Promise<FailureRecord | null> {
  const { slug, sourceAbsPath, outputAbsPath, prompt, opts } = args;
  let lastReason = "unknown failure";
  for (let attempt = 1; attempt <= MAX_ENGINE_ATTEMPTS; attempt += 1) {
    // Clear any prior output before each attempt so an engine that exits 0
    // without rewriting (a no-op) can't pass validation on a stale file.
    await unlinkSilently(outputAbsPath);
    try {
      const { stderr } = await runEngine(opts.engine, {
        prompt,
        scopeDir: opts.scopeDir,
        kiroClient: opts.kiroClient,
        // Pin the agent's glossary subprocess to the SAME absolute DB the
        // orchestrator seeded, regardless of the agent's cwd.
        env: { GLOSSARY_DB_PATH: opts.glossaryPath },
        timeoutMs: opts.engineTimeoutMs,
      });
      if (stderr.trim()) {
        console.warn(`[translate] ${slug} stderr (attempt ${attempt}):
${stderr}`);
      }
    } catch (err) {
      lastReason = `engine spawn failed: ${(err as Error).message}`;
      console.warn(
        `[translate] ${slug} attempt ${attempt} engine error: ${lastReason}`
      );
      await unlinkSilently(outputAbsPath);
      continue;
    }

    // Deterministic post-processing: rewrite recurring structural headings to
    // their canonical zh-TW form before validation, so every engine produces
    // uniformly titled sections. Skip the write if the engine already emitted
    // canonical headings (no-op idempotent pass). A missing output here means
    // the engine exited 0 without writing — let validateTranslation surface
    // that precise "output does not exist" error rather than mislabelling it.
    try {
      const original = await readFile(outputAbsPath, "utf8");
      const normalised = normalizeHeadings(original);
      if (normalised !== original) {
        await writeFile(outputAbsPath, normalised, "utf8");
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        lastReason = `heading normalization failed: ${(err as Error).message}`;
        console.warn(`[translate] ${slug} attempt ${attempt} ${lastReason}`);
        await unlinkSilently(outputAbsPath);
        continue;
      }
    }

    const result = await validateTranslation({ sourceAbsPath, outputAbsPath });
    if (result.ok) {
      return null;
    }
    lastReason = result.errors.join("; ");
    console.warn(
      `[translate] ${slug} attempt ${attempt} validation failed: ${lastReason}`
    );
    await unlinkSilently(outputAbsPath);
  }
  return { slug, reason: lastReason };
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
  const force = argv.includes("--force") || env.FORCE === "1";
  const dryRun = env.DRY_RUN === "1";

  const engine = parseEngine(env.TRANSLATE_ENGINE ?? "agy");
  const targetLang = env.TARGET_LANG ?? "zh-TW";

  const sourceDir = resolve(env.TRANSLATE_SOURCE_PATH ?? DEFAULT_ARTICLES_DIR);
  const outputDir = resolve(env.TRANSLATE_OUTPUT_PATH ?? DEFAULT_OUTPUT_DIR);
  const glossaryPath = resolve(
    env.GLOSSARY_DB_PATH ?? DEFAULT_GLOSSARY_DB_PATH
  );
  const wikiSourcesPath = resolve(
    env.WIKI_SOURCES_PATH ?? DEFAULT_WIKI_SOURCES_PATH
  );

  const concurrency = parseConcurrency(env.TRANSLATE_CONCURRENCY);
  const engineTimeoutMs = parseTimeoutMs(env.TRANSLATE_ENGINE_TIMEOUT_MS);
  const kiroClient = env.KIRO_ACP_CLIENT
    ? resolve(env.KIRO_ACP_CLIENT)
    : undefined;

  if (engine === "kiro" && !kiroClient) {
    throw new Error(
      "KIRO_ACP_CLIENT is not set. Set it to the absolute path of your kiro-acp.py client to use the `kiro` engine."
    );
  }

  return {
    concurrency,
    dryRun,
    engine,
    engineTimeoutMs,
    force,
    glossaryPath,
    kiroClient,
    onlySlug,
    outputDir,
    scopeDir: REPO_ROOT,
    sourceDir,
    targetLang,
    wikiSourcesPath,
  };
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
  console.log(`Translated: ${summary.translated.length}`);
  console.log(`Skipped:    ${summary.skipped.length}`);
  console.log(`Failed:     ${summary.failed.length}`);
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
