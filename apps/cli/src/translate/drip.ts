/**
 * Quota-paced "drip" driver for the zh-TW translation pipeline.
 *
 * Translation engines (agy, codex) exhaust their usage quota mid-run, so a full
 * sync has to be spread across quota windows (~5h for codex). This loops small
 * `translate --update --limit N` batches, re-checks remaining work via
 * `translate --check --json`, and sleeps `interval` between cycles until nothing
 * actionable remains — or the cycle cap / stall guard trips.
 *
 * The subprocess loop is intentionally thin; the decision logic lives in the
 * exported pure functions below, which the unit tests exercise directly.
 */
import { dirname, resolve } from "node:path";

const HERE = dirname(new URL(import.meta.url).pathname);
const TRANSLATE_ENTRY = resolve(HERE, "index.ts");
const GLOSSARY_ENTRY = resolve(HERE, "../glossary/cli.ts");

const MS_PER_MINUTE = 60_000;

export const DRIP_DEFAULTS = {
  limit: 10,
  intervalMin: 300,
  maxCycles: 20,
} as const;

/** Stop after this many consecutive cycles that fail to reduce the backlog. */
export const MAX_ZERO_PROGRESS_CYCLES = 3;

/**
 * Buckets a `translate --update` run actually acts on, and therefore what the
 * drip loops until empty: `stale`/`missing`/`untranslated` get (re)translated,
 * `verbatim-drift` gets a cheap resync. `fresh` is done; `orphan` is left for
 * manual cleanup (--update only warns on it, so counting it would never
 * converge).
 */
export const DRIP_ACTIONABLE_BUCKETS = [
  "missing",
  "stale",
  "verbatim-drift",
  "untranslated",
] as const;

export interface DripConfig {
  intervalMin: number;
  limit: number;
  maxCycles: number;
}

export interface CheckJson {
  buckets?: Record<string, string[]>;
}

export interface CycleInput {
  /** Running zero-progress counter as it stood before this cycle. */
  consecutiveZeroProgress: number;
  /** 1-based number of the cycle just completed. */
  cycle: number;
  maxCycles: number;
  /** Actionable count from the check before this cycle's batch. */
  prevRemaining: number;
  /** Actionable count from the check after this cycle's batch. */
  remaining: number;
}

export interface CycleDecision {
  /** Stop unsuccessfully (stalled or hit the cycle cap). */
  abort: boolean;
  consecutiveZeroProgress: number;
  /** Nothing actionable left — stop successfully. */
  done: boolean;
  /** Human-readable stop reason, or null when the loop should continue. */
  reason: string | null;
  /** Backlog reduction this cycle (never negative). */
  translated: number;
}

/** Sum the buckets a `translate --update` run would clear. */
export function countActionable(check: CheckJson): number {
  const buckets = check.buckets ?? {};
  return DRIP_ACTIONABLE_BUCKETS.reduce((total, key) => {
    const slugs = buckets[key];
    return total + (Array.isArray(slugs) ? slugs.length : 0);
  }, 0);
}

/**
 * Pull the check JSON back out of mixed stdout. `--check --json` prints the
 * human-readable table too, so scan from the end for the last line that parses
 * to an object carrying `buckets`. Returns null when no such line exists.
 */
export function parseCheckJson(stdout: string): CheckJson | null {
  const lines = stdout.split("\n");
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i].trim();
    if (!line.startsWith("{")) {
      continue;
    }
    try {
      const parsed: unknown = JSON.parse(line);
      if (parsed && typeof parsed === "object" && "buckets" in parsed) {
        return parsed as CheckJson;
      }
    } catch {
      // Not JSON (a table row that happens to start with "{"); keep scanning.
    }
  }
  return null;
}

/** Decide whether to continue, finish, or abort after a completed cycle. */
export function evaluateCycle(input: CycleInput): CycleDecision {
  const translated = Math.max(0, input.prevRemaining - input.remaining);
  const madeProgress = input.remaining < input.prevRemaining;
  const consecutiveZeroProgress = madeProgress
    ? 0
    : input.consecutiveZeroProgress + 1;

  if (input.remaining <= 0) {
    return {
      abort: false,
      consecutiveZeroProgress: 0,
      done: true,
      reason: "all translations up to date",
      translated,
    };
  }
  if (consecutiveZeroProgress >= MAX_ZERO_PROGRESS_CYCLES) {
    return {
      abort: true,
      consecutiveZeroProgress,
      done: false,
      reason: `no progress for ${MAX_ZERO_PROGRESS_CYCLES} consecutive cycles (${input.remaining} still actionable)`,
      translated,
    };
  }
  if (input.cycle >= input.maxCycles) {
    return {
      abort: true,
      consecutiveZeroProgress,
      done: false,
      reason: `reached max cycles (${input.maxCycles}); ${input.remaining} still actionable`,
      translated,
    };
  }
  return {
    abort: false,
    consecutiveZeroProgress,
    done: false,
    reason: null,
    translated,
  };
}

function parseIntOption(
  argv: string[],
  env: Record<string, string | undefined>,
  flag: string,
  envKey: string,
  fallback: number,
  min: number
): number {
  let raw: string | undefined;
  const idx = argv.indexOf(flag);
  if (idx >= 0) {
    raw = argv[idx + 1];
    if (!raw || raw.startsWith("-")) {
      throw new Error(`${flag} requires an integer >= ${min}`);
    }
  } else {
    raw = env[envKey];
  }
  if (raw == null || raw === "") {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < min) {
    throw new Error(
      `${flag} / ${envKey} must be an integer >= ${min} (got "${raw}")`
    );
  }
  return n;
}

export function parseDripArgs(
  argv: string[],
  env: Record<string, string | undefined>
): DripConfig {
  return {
    limit: parseIntOption(
      argv,
      env,
      "--limit",
      "DRIP_LIMIT",
      DRIP_DEFAULTS.limit,
      1
    ),
    intervalMin: parseIntOption(
      argv,
      env,
      "--interval-min",
      "DRIP_INTERVAL_MIN",
      DRIP_DEFAULTS.intervalMin,
      0
    ),
    maxCycles: parseIntOption(
      argv,
      env,
      "--max-cycles",
      "DRIP_MAX_CYCLES",
      DRIP_DEFAULTS.maxCycles,
      1
    ),
  };
}

async function runStreaming(args: string[]): Promise<number> {
  const proc = Bun.spawn(["bun", ...args], {
    env: process.env,
    stdout: "inherit",
    stderr: "inherit",
  });
  await proc.exited;
  return proc.exitCode ?? 0;
}

/** Run `translate --check --json` and parse its buckets out of stdout. */
async function runCheck(): Promise<CheckJson> {
  const proc = Bun.spawn(["bun", TRANSLATE_ENTRY, "--check", "--json"], {
    env: process.env,
    stdout: "pipe",
    stderr: "inherit",
  });
  const stdout = await new Response(proc.stdout).text();
  // --check exits 1 when there's drift; that's the signal, not an error. We
  // only fail if the JSON line itself is missing.
  await proc.exited;
  const parsed = parseCheckJson(stdout);
  if (!parsed) {
    throw new Error("translate --check --json produced no parseable JSON");
  }
  return parsed;
}

/** Best-effort seed refresh — never fatal. DRY_RUN keeps it read-only too. */
async function harvestGlossary(): Promise<void> {
  const addFlag = process.env.DRY_RUN === "1" ? [] : ["--add"];
  try {
    const code = await runStreaming([GLOSSARY_ENTRY, "harvest", ...addFlag]);
    if (code !== 0) {
      console.warn(`[drip] glossary harvest exited ${code}; continuing`);
    }
  } catch (err) {
    console.warn(
      `[drip] glossary harvest failed: ${(err as Error).message}; continuing`
    );
  }
}

async function main(): Promise<void> {
  const cfg = parseDripArgs(process.argv.slice(2), process.env);
  console.log(
    `[drip] starting: limit=${cfg.limit} interval=${cfg.intervalMin}min max-cycles=${cfg.maxCycles}`
  );

  await harvestGlossary();

  let prevRemaining = countActionable(await runCheck());
  console.log(`[drip] initial actionable: ${prevRemaining}`);
  if (prevRemaining <= 0) {
    console.log("[drip] nothing to translate; exiting");
    return;
  }

  let consecutiveZeroProgress = 0;
  const intervalMs = cfg.intervalMin * MS_PER_MINUTE;

  for (let cycle = 1; cycle <= cfg.maxCycles; cycle += 1) {
    const code = await runStreaming([
      TRANSLATE_ENTRY,
      "--update",
      "--limit",
      String(cfg.limit),
    ]);
    if (code !== 0) {
      // Engines exhausting quota mid-batch is the normal case this tool exists
      // for — re-check and let the stall guard catch a genuine dead end.
      console.warn(
        `[drip] cycle ${cycle}: translate batch exited ${code} (engine quota exhaustion is expected); continuing`
      );
    }

    const remaining = countActionable(await runCheck());
    const decision = evaluateCycle({
      consecutiveZeroProgress,
      cycle,
      maxCycles: cfg.maxCycles,
      prevRemaining,
      remaining,
    });
    consecutiveZeroProgress = decision.consecutiveZeroProgress;
    prevRemaining = remaining;

    const willContinue = !(decision.done || decision.abort);
    const nextWindow = willContinue
      ? new Date(Date.now() + intervalMs).toISOString()
      : "—";
    console.log(
      `[drip] cycle ${cycle}/${cfg.maxCycles}: translated ${decision.translated}, ${remaining} remaining, next window ${nextWindow}`
    );

    if (decision.done) {
      console.log(`[drip] done: ${decision.reason}`);
      return;
    }
    if (decision.abort) {
      console.warn(`[drip] stopping: ${decision.reason}`);
      process.exitCode = 1;
      return;
    }

    await Bun.sleep(intervalMs);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
