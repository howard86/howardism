import { describe, expect, it } from "bun:test";

import {
  buildEngineArgv,
  ENGINES,
  parseEngine,
  runEngine,
} from "../translate/engines.ts";

const KIRO_ENV_RE = /KIRO_ACP_CLIENT/;
const ENGINE_LIST_RE = /one of:\s*codex,\s*claude,\s*agy,\s*kiro/;

describe("ENGINES", () => {
  it("lists the four supported engines in order", () => {
    expect(ENGINES).toEqual(["codex", "claude", "agy", "kiro"]);
  });
});

describe("parseEngine", () => {
  it("accepts each known engine", () => {
    for (const engine of ENGINES) {
      expect(parseEngine(engine)).toBe(engine);
    }
  });

  it("throws on unknown engine with the allowed list in the message", () => {
    expect(() => parseEngine("gpt5")).toThrow(ENGINE_LIST_RE);
  });

  it("throws on missing engine", () => {
    expect(() => parseEngine(undefined)).toThrow();
  });
});

describe("buildEngineArgv", () => {
  const prompt = "Translate the article.";
  const scopeDir = "/repo/root";

  it("builds codex argv", () => {
    expect(buildEngineArgv("codex", { prompt, scopeDir })).toEqual([
      "codex",
      "exec",
      prompt,
    ]);
  });

  it("builds claude argv with json output for usage capture", () => {
    expect(buildEngineArgv("claude", { prompt, scopeDir })).toEqual([
      "claude",
      "-p",
      "--output-format",
      "json",
      prompt,
    ]);
  });

  it("builds agy argv with scope dir, timeout, and skip-permissions flag", () => {
    expect(buildEngineArgv("agy", { prompt, scopeDir })).toEqual([
      "agy",
      "--add-dir",
      "/repo/root",
      "--print-timeout",
      "1800s",
      "--dangerously-skip-permissions",
      "-p",
      prompt,
    ]);
  });

  it("builds kiro argv when KIRO_ACP_CLIENT path is supplied", () => {
    expect(
      buildEngineArgv("kiro", {
        prompt,
        scopeDir,
        kiroClient: "/abs/path/to/kiro-acp.py",
      })
    ).toEqual([
      "python3",
      "/abs/path/to/kiro-acp.py",
      "--cwd",
      "/repo/root",
      prompt,
    ]);
  });

  it("throws a descriptive error for kiro without KIRO_ACP_CLIENT", () => {
    expect(() => buildEngineArgv("kiro", { prompt, scopeDir })).toThrow(
      KIRO_ENV_RE
    );
  });
});

describe("runEngine", () => {
  it("invokes the injected runner with built argv and scopeDir as cwd", async () => {
    let capturedArgv: string[] = [];
    let capturedCwd = "";
    const result = await runEngine("agy", {
      prompt: "do it",
      scopeDir: "/repo/root",
      runner: (argv, opts) => {
        capturedArgv = argv;
        capturedCwd = opts.cwd;
        return Promise.resolve({ stdout: "OK", stderr: "" });
      },
    });

    expect(capturedArgv).toEqual([
      "agy",
      "--add-dir",
      "/repo/root",
      "--print-timeout",
      "1800s",
      "--dangerously-skip-permissions",
      "-p",
      "do it",
    ]);
    expect(capturedCwd).toBe("/repo/root");
    expect(result.stdout).toBe("OK");
  });

  it("forwards env and timeoutMs to the runner", async () => {
    let capturedOpts: {
      cwd: string;
      env?: Record<string, string>;
      timeoutMs?: number;
    } = {
      cwd: "",
    };
    await runEngine("codex", {
      prompt: "do it",
      scopeDir: "/repo/root",
      env: { GLOSSARY_PATH: "/abs/glossary.json" },
      timeoutMs: 1000,
      runner: (_argv, opts) => {
        capturedOpts = opts;
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    });
    expect(capturedOpts.env).toEqual({ GLOSSARY_PATH: "/abs/glossary.json" });
    expect(capturedOpts.timeoutMs).toBe(1000);
  });

  it("surfaces runner errors", async () => {
    await expect(
      runEngine("codex", {
        prompt: "x",
        scopeDir: "/tmp",
        runner: () => Promise.reject(new Error("boom")),
      })
    ).rejects.toThrow("boom");
  });

  it("parses claude --output-format json usage (cost, tokens, model)", async () => {
    const stdout = JSON.stringify({
      type: "result",
      total_cost_usd: 0.153_825,
      usage: { input_tokens: 9840, output_tokens: 93 },
      modelUsage: { "claude-opus-4-7[1m]": { costUSD: 0.153_825 } },
      result: "done",
    });
    const result = await runEngine("claude", {
      prompt: "x",
      scopeDir: "/tmp",
      runner: () => Promise.resolve({ stdout, stderr: "" }),
    });
    expect(result.usage).toEqual({
      costUsd: 0.153_825,
      inputTokens: 9840,
      outputTokens: 93,
      model: "claude-opus-4-7[1m]",
    });
  });

  it("parses kiro credits from a credits line", async () => {
    const result = await runEngine("kiro", {
      prompt: "x",
      scopeDir: "/tmp",
      kiroClient: "/abs/kiro-acp.py",
      runner: () =>
        Promise.resolve({ stdout: "…\n86.58 total credits\n", stderr: "" }),
    });
    expect(result.usage?.credits).toBeCloseTo(86.58);
  });

  it("leaves usage undefined for agy (no machine-readable output)", async () => {
    const result = await runEngine("agy", {
      prompt: "x",
      scopeDir: "/tmp",
      runner: () => Promise.resolve({ stdout: "translated.", stderr: "" }),
    });
    expect(result.usage).toBeUndefined();
  });
});
