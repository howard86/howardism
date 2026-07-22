import { describe, expect, it } from "bun:test";

import {
  buildEngineArgv,
  DEFAULT_CURSOR_MODEL,
  DEFAULT_ENGINE_MODELS,
  defaultModelForEngine,
  ENGINES,
  parseEngine,
  runEngine,
} from "../translate/engines.ts";

const KIRO_ENV_RE = /KIRO_ACP_CLIENT/;
const ENGINE_LIST_RE = /one of:\s*codex,\s*claude,\s*agy,\s*kiro,\s*cursor/;

describe("ENGINES", () => {
  it("lists the five supported engines in order", () => {
    expect(ENGINES).toEqual(["codex", "claude", "agy", "kiro", "cursor"]);
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

describe("defaultModelForEngine", () => {
  it("returns the per-engine default model, matching DEFAULT_ENGINE_MODELS", () => {
    for (const engine of ENGINES) {
      expect(defaultModelForEngine(engine)).toBe(DEFAULT_ENGINE_MODELS[engine]);
    }
  });

  it("returns the codex and cursor defaults, and null for the rest", () => {
    expect(defaultModelForEngine("codex")).toBe("gpt-5.6-luna");
    expect(defaultModelForEngine("cursor")).toBe(DEFAULT_CURSOR_MODEL);
    expect(defaultModelForEngine("claude")).toBeNull();
    expect(defaultModelForEngine("agy")).toBeNull();
    expect(defaultModelForEngine("kiro")).toBeNull();
  });
});

describe("buildEngineArgv", () => {
  const prompt = "Translate the article.";
  const scopeDir = "/repo/root";

  it("builds codex argv with the default model, medium reasoning effort, and reproducible flags", () => {
    expect(buildEngineArgv("codex", { prompt, scopeDir })).toEqual([
      "codex",
      "exec",
      "--json",
      "--ignore-user-config",
      "-m",
      "gpt-5.6-luna",
      "-c",
      'model_reasoning_effort="medium"',
      "--cd",
      scopeDir,
      "-s",
      "workspace-write",
      "--color",
      "never",
      prompt,
    ]);
  });

  it("builds codex argv with an overridden model and reasoning effort", () => {
    expect(
      buildEngineArgv("codex", {
        prompt,
        scopeDir,
        model: "gpt-5.6-sol",
        reasoningEffort: "xhigh",
      })
    ).toEqual([
      "codex",
      "exec",
      "--json",
      "--ignore-user-config",
      "-m",
      "gpt-5.6-sol",
      "-c",
      'model_reasoning_effort="xhigh"',
      "--cd",
      scopeDir,
      "-s",
      "workspace-write",
      "--color",
      "never",
      prompt,
    ]);
  });

  it("builds codex structured argv: read-only sandbox plus --output-schema and -o", () => {
    expect(
      buildEngineArgv("codex", {
        prompt,
        scopeDir,
        outputSchemaPath: "/tmp/x/schema.json",
        outputLastMessagePath: "/tmp/x/last-message.json",
      })
    ).toEqual([
      "codex",
      "exec",
      "--json",
      "--ignore-user-config",
      "-m",
      "gpt-5.6-luna",
      "-c",
      'model_reasoning_effort="medium"',
      "--cd",
      scopeDir,
      // The model writes nothing in structured mode, so it needs no write access.
      "-s",
      "read-only",
      "--color",
      "never",
      "--output-schema",
      "/tmp/x/schema.json",
      "-o",
      "/tmp/x/last-message.json",
      prompt,
    ]);
  });

  it("keeps the workspace-write fallback argv when only one structured path is supplied", () => {
    for (const partial of [
      { outputSchemaPath: "/tmp/x/schema.json" },
      { outputLastMessagePath: "/tmp/x/last-message.json" },
    ]) {
      const argv = buildEngineArgv("codex", { prompt, scopeDir, ...partial });
      expect(argv).toEqual(buildEngineArgv("codex", { prompt, scopeDir }));
      expect(argv).toContain("workspace-write");
      expect(argv).not.toContain("--output-schema");
      expect(argv).not.toContain("-o");
    }
  });

  it("ignores the structured paths for non-codex engines", () => {
    const structured = {
      outputSchemaPath: "/tmp/x/schema.json",
      outputLastMessagePath: "/tmp/x/last-message.json",
    };
    for (const engine of ["claude", "agy", "cursor"] as const) {
      expect(
        buildEngineArgv(engine, { prompt, scopeDir, ...structured })
      ).toEqual(buildEngineArgv(engine, { prompt, scopeDir }));
    }
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

  it("builds cursor argv with default composer model, json output, and headless flags", () => {
    expect(buildEngineArgv("cursor", { prompt, scopeDir })).toEqual([
      "cursor-agent",
      "-p",
      "--output-format",
      "json",
      "--model",
      "composer-2.5",
      "--force",
      "--trust",
      "--workspace",
      "/repo/root",
      prompt,
    ]);
  });

  it("builds cursor argv with an overridden model", () => {
    expect(
      buildEngineArgv("cursor", {
        prompt,
        scopeDir,
        cursorModel: "composer-2.5-fast",
      })
    ).toEqual([
      "cursor-agent",
      "-p",
      "--output-format",
      "json",
      "--model",
      "composer-2.5-fast",
      "--force",
      "--trust",
      "--workspace",
      "/repo/root",
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
      "--model",
      "auto",
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

  it("forwards the structured output paths through to the built argv", async () => {
    let capturedArgv: string[] = [];
    await runEngine("codex", {
      prompt: "do it",
      scopeDir: "/repo/root",
      outputSchemaPath: "/tmp/x/schema.json",
      outputLastMessagePath: "/tmp/x/last-message.json",
      runner: (argv) => {
        capturedArgv = argv;
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    });
    expect(capturedArgv).toContain("--output-schema");
    expect(capturedArgv).toContain("/tmp/x/schema.json");
    expect(capturedArgv).toContain("-o");
    expect(capturedArgv).toContain("/tmp/x/last-message.json");
    expect(capturedArgv).toContain("read-only");
  });

  it("forwards onStderrLine to the runner", async () => {
    const cb = () => {
      // no-op sentinel — only identity matters
    };
    let capturedOnStderrLine: unknown;
    await runEngine("codex", {
      prompt: "do it",
      scopeDir: "/repo/root",
      onStderrLine: cb,
      runner: (_argv, opts) => {
        capturedOnStderrLine = opts.onStderrLine;
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    });
    expect(capturedOnStderrLine).toBe(cb);
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

  it("parses codex --json usage, summing multiple turn.completed lines and ignoring junk", async () => {
    const stdout = [
      "not json",
      JSON.stringify({ type: "item.completed", usage: { input_tokens: 999 } }),
      JSON.stringify({
        type: "turn.completed",
        usage: {
          input_tokens: 21_452,
          cached_input_tokens: 9984,
          cache_write_input_tokens: 0,
          output_tokens: 5,
          reasoning_output_tokens: 0,
        },
      }),
      "{not valid json}",
      JSON.stringify({
        type: "turn.completed",
        usage: {
          input_tokens: 1000,
          cached_input_tokens: 200,
          cache_write_input_tokens: 50,
          output_tokens: 20,
          reasoning_output_tokens: 5,
        },
      }),
    ].join("\n");
    const result = await runEngine("codex", {
      prompt: "x",
      scopeDir: "/tmp",
      model: "gpt-5.6-luna",
      runner: () => Promise.resolve({ stdout, stderr: "" }),
    });
    expect(result.usage).toEqual({
      cachedInputTokens: 10_184,
      cacheWriteInputTokens: 50,
      inputTokens: 22_452,
      model: "gpt-5.6-luna",
      outputTokens: 25,
      reasoningOutputTokens: 5,
    });
  });

  it("leaves codex usage undefined when no turn.completed line is present", async () => {
    const result = await runEngine("codex", {
      prompt: "x",
      scopeDir: "/tmp",
      runner: () => Promise.resolve({ stdout: "translated.\n", stderr: "" }),
    });
    expect(result.usage).toBeUndefined();
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

  it("parses cursor --output-format json token usage", async () => {
    const stdout = JSON.stringify({
      type: "result",
      subtype: "success",
      is_error: false,
      result: "translated.",
      usage: {
        inputTokens: 20_108,
        outputTokens: 35,
        cacheReadTokens: 5344,
        cacheWriteTokens: 0,
      },
    });
    const result = await runEngine("cursor", {
      prompt: "x",
      scopeDir: "/tmp",
      runner: () => Promise.resolve({ stdout, stderr: "" }),
    });
    expect(result.usage).toEqual({
      inputTokens: 20_108,
      outputTokens: 35,
    });
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
