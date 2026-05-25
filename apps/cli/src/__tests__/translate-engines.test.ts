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

  it("builds claude argv", () => {
    expect(buildEngineArgv("claude", { prompt, scopeDir })).toEqual([
      "claude",
      "-p",
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
});
