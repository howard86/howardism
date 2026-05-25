export const ENGINES = ["codex", "claude", "agy", "kiro"] as const;

export type Engine = (typeof ENGINES)[number];

export interface EngineRunResult {
  stderr: string;
  stdout: string;
}

export interface EngineSpawnOptions {
  cwd: string;
  /** Extra env vars merged over the inherited environment. */
  env?: Record<string, string>;
  /** Kill the subprocess after this many ms (0/undefined = no timeout). */
  timeoutMs?: number;
}

export type EngineRunner = (
  argv: string[],
  spawnOptions: EngineSpawnOptions
) => Promise<EngineRunResult>;

export interface BuildEngineArgvArgs {
  /** Absolute path to the kiro-acp.py client; required only for `kiro`. */
  kiroClient?: string;
  prompt: string;
  scopeDir: string;
}

export interface RunEngineArgs {
  /** Extra env vars merged over the inherited environment for the subprocess. */
  env?: Record<string, string>;
  kiroClient?: string;
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
 * - kiro shells out to a Python ACP client (`kiroClient`) that drives the
 *   `kiro-cli acp` JSON-RPC protocol; we never hardcode that path here so the
 *   tooling is portable across machines.
 */
export function buildEngineArgv(
  engine: Engine,
  args: BuildEngineArgvArgs
): string[] {
  const { prompt, scopeDir, kiroClient } = args;
  if (engine === "codex") {
    return ["codex", "exec", prompt];
  }
  if (engine === "claude") {
    return ["claude", "-p", prompt];
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
  if (!kiroClient) {
    throw new Error(
      "KIRO_ACP_CLIENT is not set. Set it to the absolute path of your kiro-acp.py client to use the `kiro` engine."
    );
  }
  return ["python3", kiroClient, "--cwd", scopeDir, prompt];
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
  // --print-timeout). Killing closes the pipes, so the text() reads resolve.
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
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
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
  }
};

/**
 * Spawn `engine` against `scopeDir` with `prompt`, returning captured streams.
 * `runner` is injected by tests so unit tests never spawn a real process.
 * Throws (via the runner) on non-zero exit with stdout/stderr in the message.
 */
export function runEngine(
  engine: Engine,
  args: RunEngineArgs
): Promise<EngineRunResult> {
  const argv = buildEngineArgv(engine, {
    kiroClient: args.kiroClient,
    prompt: args.prompt,
    scopeDir: args.scopeDir,
  });
  const exec = args.runner ?? defaultRunner;
  return exec(argv, {
    cwd: args.scopeDir,
    env: args.env,
    timeoutMs: args.timeoutMs,
  });
}
