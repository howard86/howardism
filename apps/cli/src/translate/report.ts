import type { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { computeCostUsd, type ModelPrice, resolvePrices } from "./pricing.ts";
import {
  DEFAULT_TRACKING_DB_PATH,
  latestBySlug,
  openTrackingDb,
  type SpendByModel,
  spendByModel,
} from "./tracking/store.ts";

const DEFAULT_LOCALE = "zh-TW";
const DEFAULT_TOP_N = 10;
const SECONDS_PER_MINUTE = 60;
const MODEL_COL_WIDTH = 22;
const SLUG_COL_WIDTH = 22;
const TOKEN_COL_WIDTH = 14;

export interface ReportModelRow extends SpendByModel {
  cacheHitRate: number | null;
}

export interface ReportTopArticle {
  cachedInputTokens: number;
  costUsd: number | null;
  durationMs: number;
  estimated: boolean;
  inputTokens: number;
  model: string | null;
  outputTokens: number;
  slug: string;
}

export interface ReportTotals {
  articles: number;
  cachedInputTokens: number;
  costUsd: number | null;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  runs: number;
}

export interface TranslateReport {
  anyPriceConfigured: boolean;
  empty: boolean;
  locale: string;
  models: ReportModelRow[];
  topArticles: ReportTopArticle[];
  topRankedBy: "cost" | "tokens";
  totals: ReportTotals;
}

export interface BuildReportOptions {
  env?: Record<string, string | undefined>;
  locale?: string;
  top?: number;
}

const emptyTotals = (): ReportTotals => ({
  runs: 0,
  articles: 0,
  inputTokens: 0,
  outputTokens: 0,
  cachedInputTokens: 0,
  durationMs: 0,
  costUsd: null,
});

const emptyReport = (locale: string): TranslateReport => ({
  anyPriceConfigured: false,
  empty: true,
  locale,
  models: [],
  topArticles: [],
  topRankedBy: "tokens",
  totals: emptyTotals(),
});

interface Priceable {
  cachedInputTokens: number;
  costUsd: number | null;
  estimated: boolean;
  inputTokens: number;
  model: string | null;
  outputTokens: number;
}

/**
 * Retroactively price a row that has no recorded cost, using a model price
 * resolved from `TRANSLATE_PRICING` — lets a user set pricing after the fact
 * and see USD for runs an engine (e.g. codex) reported tokens for but no
 * cost. Returns `row` unchanged if it already has a cost or no price is
 * configured for its model.
 */
function priceIfConfigured<T extends Priceable>(
  row: T,
  prices: Record<string, ModelPrice>
): T {
  if (row.costUsd !== null || !row.model || !prices[row.model]) {
    return row;
  }
  const computed = computeCostUsd(
    {
      inputTokens: row.inputTokens,
      cachedInputTokens: row.cachedInputTokens,
      outputTokens: row.outputTokens,
    },
    prices[row.model]
  );
  return computed === null
    ? row
    : { ...row, costUsd: computed, estimated: true };
}

/**
 * Build the pure data shape behind `translate:report` from the tracking DB.
 * Read-only: never writes to `db`. Separated from {@link printReport} so it
 * can be tested without a terminal.
 */
export function buildReport(
  db: Database,
  opts: BuildReportOptions = {}
): TranslateReport {
  const locale = opts.locale ?? DEFAULT_LOCALE;
  const top = opts.top ?? DEFAULT_TOP_N;
  const prices = resolvePrices(opts.env ?? {});

  const rawModels = spendByModel(db, locale);
  if (rawModels.length === 0) {
    return emptyReport(locale);
  }

  const models: ReportModelRow[] = rawModels
    .map((row) => priceIfConfigured({ ...row }, prices))
    .map((row) => ({
      ...row,
      cacheHitRate:
        row.inputTokens > 0 ? row.cachedInputTokens / row.inputTokens : null,
    }));

  const totals = models.reduce<ReportTotals>((acc, m) => {
    acc.runs += m.runs;
    acc.inputTokens += m.inputTokens;
    acc.outputTokens += m.outputTokens;
    acc.cachedInputTokens += m.cachedInputTokens;
    acc.durationMs += m.totalDurationMs;
    if (m.costUsd !== null) {
      acc.costUsd = (acc.costUsd ?? 0) + m.costUsd;
    }
    return acc;
  }, emptyTotals());

  // Distinct-article count across ALL models — summing each model's own
  // `articles` would double-count a slug re-translated under a different
  // model, so use the latest-per-slug view instead.
  const latest = latestBySlug(db, locale);
  totals.articles = latest.length;

  const priced: ReportTopArticle[] = latest.map((run) =>
    priceIfConfigured(
      {
        slug: run.slug,
        model: run.model,
        inputTokens: run.inputTokens ?? 0,
        outputTokens: run.outputTokens ?? 0,
        cachedInputTokens: run.cachedInputTokens ?? 0,
        durationMs: run.durationMs,
        costUsd: run.costUsd,
        estimated: run.costEstimated === true,
      },
      prices
    )
  );

  const topRankedBy: "cost" | "tokens" = priced.some((r) => r.costUsd !== null)
    ? "cost"
    : "tokens";
  const ranked = [...priced].sort((a, b) => {
    if (topRankedBy === "cost") {
      return (
        (b.costUsd ?? Number.NEGATIVE_INFINITY) -
        (a.costUsd ?? Number.NEGATIVE_INFINITY)
      );
    }
    return b.inputTokens + b.outputTokens - (a.inputTokens + a.outputTokens);
  });

  return {
    anyPriceConfigured: models.some((m) => m.costUsd !== null),
    empty: false,
    locale,
    models,
    topArticles: ranked.slice(0, top),
    topRankedBy,
    totals,
  };
}

const formatInt = (n: number): string => n.toLocaleString("en-US");

function formatDuration(ms: number): string {
  const totalSeconds = ms / 1000;
  if (totalSeconds < SECONDS_PER_MINUTE) {
    return `${totalSeconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = Math.round(totalSeconds % SECONDS_PER_MINUTE);
  return `${minutes}m ${seconds}s`;
}

function formatCost(costUsd: number | null, estimated: boolean): string {
  if (costUsd === null) {
    return "—";
  }
  return `$${costUsd.toFixed(4)}${estimated ? "*" : ""}`;
}

function formatPercent(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}

function printPricingHint(report: TranslateReport): void {
  const exampleModel =
    report.models.find((m) => m.model)?.model ?? "your-model";
  console.log("");
  console.log(
    "No model in this report has a configured price — cost columns show — (tokens are always recorded regardless)."
  );
  console.log("Set TRANSLATE_PRICING to compute USD, e.g.:");
  console.log(
    `  TRANSLATE_PRICING='{"${exampleModel}":{"inputPerMTok":1.25,"cachedInputPerMTok":0.125,"outputPerMTok":10}}'`
  );
}

/** Render {@link TranslateReport} as plain-text tables via `console.log`. */
export function printReport(report: TranslateReport): void {
  console.log(`=== Translate report (${report.locale}) ===`);
  if (report.empty) {
    console.log("No runs recorded yet for this locale — nothing to report.");
    return;
  }

  console.log("");
  console.log(
    `${"Model".padEnd(MODEL_COL_WIDTH)}${"Runs".padStart(6)}${"Articles".padStart(10)}${"Input".padStart(TOKEN_COL_WIDTH)}${"Cached".padStart(TOKEN_COL_WIDTH)}${"Cache%".padStart(8)}${"Output".padStart(TOKEN_COL_WIDTH)}${"Duration".padStart(10)}${"Cost".padStart(14)}`
  );
  for (const m of report.models) {
    console.log(
      `${(m.model ?? "(untracked)").padEnd(MODEL_COL_WIDTH)}${String(m.runs).padStart(6)}${String(m.articles).padStart(10)}${formatInt(m.inputTokens).padStart(TOKEN_COL_WIDTH)}${formatInt(m.cachedInputTokens).padStart(TOKEN_COL_WIDTH)}${formatPercent(m.cacheHitRate).padStart(8)}${formatInt(m.outputTokens).padStart(TOKEN_COL_WIDTH)}${formatDuration(m.totalDurationMs).padStart(10)}${formatCost(m.costUsd, m.estimated).padStart(14)}`
    );
  }
  if (report.models.some((m) => m.estimated)) {
    console.log(
      "* = estimated from TRANSLATE_PRICING, not reported by the engine"
    );
  }

  const { totals } = report;
  console.log("");
  console.log("=== Totals ===");
  console.log(`Runs:      ${formatInt(totals.runs)}`);
  console.log(`Articles:  ${formatInt(totals.articles)}`);
  console.log(
    `Tokens:    ${formatInt(totals.inputTokens + totals.outputTokens)} (input ${formatInt(totals.inputTokens)}, cached ${formatInt(totals.cachedInputTokens)}, output ${formatInt(totals.outputTokens)})`
  );
  console.log(`Duration:  ${formatDuration(totals.durationMs)}`);
  console.log(
    `Cost:      ${formatCost(
      totals.costUsd,
      report.models.some((m) => m.costUsd !== null && m.estimated)
    )}`
  );

  console.log("");
  const rankLabel =
    report.topRankedBy === "cost" ? "cost" : "tokens (no cost recorded)";
  console.log(
    `=== Top ${report.topArticles.length} articles by ${rankLabel} ===`
  );
  for (const a of report.topArticles) {
    console.log(
      `${a.slug.padEnd(SLUG_COL_WIDTH)}${(a.model ?? "—").padEnd(MODEL_COL_WIDTH)}${formatInt(a.inputTokens + a.outputTokens).padStart(12)}${formatCost(a.costUsd, a.estimated).padStart(14)}${formatDuration(a.durationMs).padStart(10)}`
    );
  }

  if (!report.anyPriceConfigured) {
    printPricingHint(report);
  }
}

function parseTopOption(argv: string[]): number {
  const idx = argv.indexOf("--top");
  if (idx < 0) {
    return DEFAULT_TOP_N;
  }
  const next = argv[idx + 1];
  const n = Number.parseInt(next ?? "", 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(
      `--top requires a positive integer, e.g. --top 5 (got "${next}")`
    );
  }
  return n;
}

function main(): void {
  const argv = process.argv.slice(2);
  const env = process.env;
  const json = argv.includes("--json");
  const top = parseTopOption(argv);
  const locale = env.TARGET_LANG ?? DEFAULT_LOCALE;
  const trackingDbPath = resolve(
    env.TRANSLATE_TRACKING_DB_PATH ?? DEFAULT_TRACKING_DB_PATH
  );

  // A fresh clone / brand-new machine legitimately has no history yet — that
  // is not an error, so don't even create the DB file by opening it.
  if (!existsSync(trackingDbPath)) {
    console.log(
      `[translate:report] no history DB found at ${trackingDbPath} — no runs recorded yet.`
    );
    return;
  }

  const db = openTrackingDb(trackingDbPath);
  let report: TranslateReport;
  try {
    report = buildReport(db, { locale, top, env });
  } finally {
    db.close();
  }

  if (report.empty) {
    console.log(
      `[translate:report] no runs recorded yet for locale "${locale}".`
    );
    return;
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  printReport(report);
}

if (import.meta.main) {
  main();
}
