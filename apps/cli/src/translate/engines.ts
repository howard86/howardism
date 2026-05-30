export const ENGINES = ["codex", "claude", "agy", "kiro", "cursor"] as const;

export type Engine = (typeof ENGINES)[number];

/** Cursor's "composer" model — overridable per run via `TRANSLATE_CURSOR_MODEL`. */
export const DEFAULT_CURSOR_MODEL = "composer-2.5";

/**
 * Best-effort cost/usage telemetry parsed from an engine's stdout. Every field
 * is optional: `claude --output-format json` populates all of them, `kiro` may
 * surface credits over ACP, `cursor --output-format json` reports input/output
 * tokens (no cost/model), and `agy`/`codex` expose nothing machine-readable
 * (left undefined; the orchestrator backfills a configured model label).
 */
export interface EngineUsage {
  costUsd?: number;
  credits?: number;
  inputTokens?: number;
  model?: string;
  outputTokens?: number;
}

export interface EngineRunResult {
  stderr: string;
  stdout: string;
  usage?: EngineUsage;
}

export interface EngineSpawnOptions {
  cwd: string;
  /** Extra env vars merged over the inherited environment. */
  env?: Record<string, string>;
  /** Called for each stderr line as it arrives; useful for live progress. */
  onStderrLine?: (line: string) => void;
  /** Kill the subprocess after this many ms (0/undefined = no timeout). */
  timeoutMs?: number;
}

export type EngineRunner = (
  argv: string[],
  spawnOptions: EngineSpawnOptions
) => Promise<EngineRunResult>;

export interface BuildEngineArgvArgs {
  /** Model passed to `cursor --model`; defaults to {@link DEFAULT_CURSOR_MODEL}. */
  cursorModel?: string;
  /** Absolute path to the kiro-acp.py client; required only for `kiro`. */
  kiroClient?: string;
  prompt: string;
  scopeDir: string;
}

export interface RunEngineArgs {
  /** Model passed to `cursor --model`; defaults to {@link DEFAULT_CURSOR_MODEL}. */
  cursorModel?: string;
  /** Extra env vars merged over the inherited environment for the subprocess. */
  env?: Record<string, string>;
  kiroClient?: string;
  /** Called for each stderr line as it arrives; useful for live progress. */
  onStderrLine?: (line: string) => void;
  prompt: string;
  runner?: EngineRunner;
  scopeDir: string;
  /** Kill the subprocess after this many ms (0/undefined = no timeout). */
  timeoutMs?: number;
}

const isEngine = (value: string): value is Engine =>
  (ENGINES as readonly string[]).includes(value);

/**
 * Validate `TRANSLATE_ENGINE` (or any caller-supplied string) and return it
 * narrowed to `Engine`. Throws a clear listing of allowed engines on miss.
 */
export function parseEngine(value: string | undefined): Engine {
  if (!value) {
    throw new Error(
      `TRANSLATE_ENGINE is required (one of: ${ENGINES.join(", ")})`
    );
  }
  if (!isEngine(value)) {
    throw new Error(
      `Unknown engine "${value}" — must be one of: ${ENGINES.join(", ")}`
    );
  }
  return value;
}

/**
 * Build the argv array for spawning `engine` with `prompt`. Pure: no env, no
 * filesystem, no spawning — unit-tested directly.
 *
 * - codex/claude take the prompt as the final positional argument.
 * - agy uses `--add-dir <scope>` and `--print-timeout 1800s` plus
 *   `--dangerously-skip-permissions` so it runs unattended.
 * - cursor runs `cursor-agent -p` headlessly with `--output-format json` (for
 *   usage capture), `--force` + `--trust` so it can write files / shell out to
 *   the glossary CLI without prompting, and `--model <cursorModel>` (defaults to
 *   the composer model).
 * - kiro shells out to a Python ACP client (`kiroClient`) that drives the
 *   `kiro-cli acp` JSON-RPC protocol; we never hardcode that path here so the
 *   tooling is portable across machines.
 */
export function buildEngineArgv(
  engine: Engine,
  args: BuildEngineArgvArgs
): string[] {
  const { prompt, scopeDir, kiroClient, cursorModel } = args;
  if (engine === "codex") {
    return ["codex", "exec", prompt];
  }
  if (engine === "claude") {
    // `--output-format json` makes the final stdout a single JSON object with
    // total_cost_usd / usage / modelUsage — the agent still writes the output
    // file via its tools, so the file-based workflow is unchanged.
    return ["claude", "-p", "--output-format", "json", prompt];
  }
  if (engine === "agy") {
    return [
      "agy",
      "--add-dir",
      scopeDir,
      "--print-timeout",
      "1800s",
      "--dangerously-skip-permissions",
      "-p",
      prompt,
    ];
  }
  if (engine === "cursor") {
    return [
      "cursor-agent",
      "-p",
      "--output-format",
      "json",
      "--model",
      cursorModel ?? DEFAULT_CURSOR_MODEL,
      "--force",
      "--trust",
      "--workspace",
      scopeDir,
      prompt,
    ];
  }
  if (!kiroClient) {
    throw new Error(
      "KIRO_ACP_CLIENT is not set. Set it to the absolute path of your kiro-acp.py client to use the `kiro` engine."
    );
  }
  return ["python3", kiroClient, "--cwd", scopeDir, "--model", "auto", prompt];
}

// Drain a ReadableStream<Uint8Array> line by line, calling onLine for each
// line as it arrives and returning the full text when the stream closes.
// Must be used with Promise.all over stdout+stderr to avoid pipe deadlocks.
async function drainStream(
  stream: ReadableStream<Uint8Array>,
  onLine?: (line: string) => void
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const all: string[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        // Strip trailing \r so CRLF-terminated lines don't corrupt terminal output.
        const line = buffer.slice(0, newline).replace(TRAILING_CR_RE, "");
        buffer = buffer.slice(newline + 1);
        all.push(line);
        onLine?.(line);
        newline = buffer.indexOf("\n");
      }
    }
    // Flush the TextDecoder's internal buffer so multi-byte UTF-8 sequences
    // split across the last two chunks are not silently dropped.
    buffer += decoder.decode();
    if (buffer) {
      all.push(buffer);
      onLine?.(buffer);
    }
  } finally {
    reader.releaseLock();
  }
  return all.join("\n");
}

const defaultRunner: EngineRunner = async (argv, spawnOptions) => {
  const proc = Bun.spawn(argv, {
    cwd: spawnOptions.cwd,
    // Bun.spawn REPLACES the environment, so merge over the inherited one.
    env: spawnOptions.env
      ? { ...process.env, ...spawnOptions.env }
      : process.env,
    stderr: "pipe",
    stdout: "pipe",
  });
  // Guard against a subprocess that never EOFs: kill it after timeoutMs so a
  // hung engine can't pin a concurrency slot forever (only agy has its own
  // --print-timeout). Killing closes the pipes, so the drainStream reads resolve.
  let timedOut = false;
  const timer =
    spawnOptions.timeoutMs && spawnOptions.timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          proc.kill();
        }, spawnOptions.timeoutMs)
      : null;
  try {
    const [stdout, stderr] = await Promise.all([
      drainStream(proc.stdout),
      drainStream(proc.stderr, spawnOptions.onStderrLine),
    ]);
    const exitCode = await proc.exited;
    if (timedOut) {
      throw new Error(
        `${argv[0]} timed out after ${spawnOptions.timeoutMs}ms and was killed`
      );
    }
    if (exitCode !== 0) {
      throw new Error(
        `${argv[0]} failed (exit ${exitCode})\nstdout: ${stdout}\nstderr: ${stderr}`
      );
    }
    return { stdout, stderr };
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
    // Kill the subprocess on any error path so a failed drainStream can't
    // leave it running and pinning a concurrency slot indefinitely.
    try {
      proc.kill();
    } catch {
      // already exited — ignore
    }
  }
};

const numberOr = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** Parse `claude --output-format json` stdout for cost / tokens / model. */
const parseClaudeUsage = (stdout: string): EngineUsage | undefined => {
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(stdout) as Record<string, unknown>;
  } catch {
    return;
  }
  const usage: EngineUsage = {};
  usage.costUsd = numberOr(json.total_cost_usd);
  const inner = json.usage as Record<string, unknown> | undefined;
  if (inner) {
    usage.inputTokens = numberOr(inner.input_tokens);
    usage.outputTokens = numberOr(inner.output_tokens);
  }
  const modelUsage = json.modelUsage as Record<string, unknown> | undefined;
  if (modelUsage && typeof modelUsage === "object") {
    usage.model = Object.keys(modelUsage)[0];
  } else if (typeof json.model === "string") {
    usage.model = json.model;
  }
  return hasAnyField(usage) ? usage : undefined;
};

const CREDITS_RE = /([\d.]+)\s+(?:total\s+)?credits/i;
const TRAILING_CR_RE = /\r$/;

/**
 * Best-effort usage parse for the kiro ACP client: prefer a JSON line carrying
 * usage fields, else fall back to a "<n> credits" line. Returns undefined when
 * the client surfaced nothing parseable.
 */
const parseKiroUsage = (stdout: string): EngineUsage | undefined => {
  const usage: EngineUsage = {};
  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const json = JSON.parse(trimmed) as Record<string, unknown>;
        usage.credits ??= numberOr(json.credits);
        usage.costUsd ??= numberOr(json.cost_usd ?? json.total_cost_usd);
        usage.inputTokens ??= numberOr(json.input_tokens);
        usage.outputTokens ??= numberOr(json.output_tokens);
        if (!usage.model && typeof json.model === "string") {
          usage.model = json.model;
        }
      } catch {
        // not a usage line — ignore
      }
    }
  }
  if (usage.credits === undefined) {
    const m = stdout.match(CREDITS_RE);
    if (m) {
      usage.credits = Number.parseFloat(m[1]);
    }
  }
  return hasAnyField(usage) ? usage : undefined;
};

const hasAnyField = (usage: EngineUsage): boolean =>
  Object.values(usage).some((v) => v !== undefined);

/**
 * Parse `cursor-agent --output-format json` stdout for token usage. The final
 * line is a single result object `{ type: "result", usage: { inputTokens,
 * outputTokens, … } }`; we scan for the last parseable result object so any
 * preceding log lines are ignored. Cursor reports no cost or model.
 */
const parseCursorUsage = (stdout: string): EngineUsage | undefined => {
  let usage: EngineUsage | undefined;
  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (!(trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      continue;
    }
    try {
      const json = JSON.parse(trimmed) as Record<string, unknown>;
      const inner = json.usage as Record<string, unknown> | undefined;
      if (inner) {
        usage = {
          inputTokens: numberOr(inner.inputTokens),
          outputTokens: numberOr(inner.outputTokens),
        };
      }
    } catch {
      // not a JSON line — ignore
    }
  }
  return usage && hasAnyField(usage) ? usage : undefined;
};

/** Extract usage from a finished run; only claude/kiro/cursor expose anything. */
export function parseUsage(
  engine: Engine,
  result: EngineRunResult
): EngineUsage | undefined {
  if (engine === "claude") {
    return parseClaudeUsage(result.stdout);
  }
  if (engine === "kiro") {
    return parseKiroUsage(result.stdout);
  }
  if (engine === "cursor") {
    return parseCursorUsage(result.stdout);
  }
  return;
}

/**
 * Spawn `engine` against `scopeDir` with `prompt`, returning captured streams
 * plus best-effort usage telemetry. `runner` is injected by tests so unit
 * tests never spawn a real process. Throws (via the runner) on non-zero exit
 * with stdout/stderr in the message.
 */
export async function runEngine(
  engine: Engine,
  args: RunEngineArgs
): Promise<EngineRunResult> {
  const argv = buildEngineArgv(engine, {
    cursorModel: args.cursorModel,
    kiroClient: args.kiroClient,
    prompt: args.prompt,
    scopeDir: args.scopeDir,
  });
  const exec = args.runner ?? defaultRunner;
  const result = await exec(argv, {
    cwd: args.scopeDir,
    env: args.env,
    onStderrLine: args.onStderrLine,
    timeoutMs: args.timeoutMs,
  });
  const usage = parseUsage(engine, result);
  return usage ? { ...result, usage } : result;
}
