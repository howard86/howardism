import { beforeEach, describe, expect, it } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chunkArticle } from "../translate/chunk.ts";
import type { EngineRunner } from "../translate/engines.ts";
import {
  type EngineOptions,
  runChunkedWithRetry,
  STRUCTURED_MAX_SOURCE_BYTES,
  sumUsages,
  useChunkedMode,
  useStructuredMode,
} from "../translate/index.ts";

const SLUG = "chunked-fixture";
const PART_RE = /PART (\d+) OF (\d+)/;
const SOURCE_MARKER_RE = /\nSOURCE MDX — PART \d+ OF \d+\n/;
const RETRY_FEEDBACK = "\n\nPREVIOUS ATTEMPT REJECTED";
const FAILED_PART_2_RE = /^part 2\/\d+: /;
const LINK_ERROR_RE = /Link URLs changed/;
const MOSTLY_ENGLISH_RE = /^reassembled article: .*mostly English/;
const PROSE_LINE_RE = /^(?:## |- |[A-Z])/;
const ZH = "這是一段翻譯後的繁體中文內容，用來取代原本的英文段落。";

const SOURCE = [
  "---",
  "date: 2026-09-01",
  "title: Chunked Fixture",
  "description: A fixture for chunked translation",
  "tag: Concept",
  "domain: agent-systems",
  "readingTime: 9",
  "imageAlt: Illustration for Chunked Fixture",
  "---",
  `export { default as heroImage } from "../assets/${SLUG}.webp";`,
  "",
  "Intro paragraph with a [link](/articles/intro-link).",
  "",
  ...["Alpha", "Beta", "Gamma"].flatMap((name) => [
    `## ${name}`,
    "",
    `The ${name} section explains one idea and cites [a source](https://example.com/${name.toLowerCase()}).`,
    "",
    `- First ${name} bullet`,
    `- Second ${name} bullet`,
    "",
  ]),
].join("\n");

/** "Translate" one part: append Chinese to every prose line, keep all syntax. */
const fakeTranslate = (part: string): string =>
  part
    .split("\n")
    .map((line) =>
      PROSE_LINE_RE.test(line) && !line.startsWith("export ")
        ? `${line} ${ZH}`
        : line
    )
    .join("\n");

const USAGE_LINE = JSON.stringify({
  type: "turn.completed",
  usage: {
    cached_input_tokens: 10,
    input_tokens: 100,
    output_tokens: 50,
    reasoning_output_tokens: 5,
  },
});

interface FakeCall {
  part: number;
  prompt: string;
  total: number;
}

/**
 * A codex stand-in: reads the part out of the prompt, writes the `-o` JSON
 * final message the real engine would, and reports one turn of usage.
 */
const fakeRunner = (
  calls: FakeCall[],
  transform: (part: string, call: FakeCall) => string = fakeTranslate
): EngineRunner => {
  return async (argv) => {
    const prompt = argv.at(-1) ?? "";
    const [, part, total] = prompt.match(PART_RE) ?? [];
    const call = { part: Number(part), prompt, total: Number(total) };
    calls.push(call);
    // A retry prompt appends its feedback after the inlined source.
    const [, inlined = ""] = prompt.split(SOURCE_MARKER_RE);
    const [source] = inlined.split(RETRY_FEEDBACK);
    const [lastMessagePath] = argv.slice(argv.indexOf("-o") + 1);
    await Bun.write(
      lastMessagePath,
      JSON.stringify({
        mdx: transform(source, call),
        newTerms: [{ category: "tech", term: `Term${call.part}` }],
      })
    );
    return { stdout: USAGE_LINE, stderr: "" };
  };
};

let dir: string;
let sourceAbsPath: string;
let outputAbsPath: string;
let opts: EngineOptions;
const chunks = chunkArticle(SOURCE, 200);

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "translate-chunked-test-"));
  sourceAbsPath = join(dir, "en", `${SLUG}.mdx`);
  outputAbsPath = join(dir, "zh", `${SLUG}.mdx`);
  await Bun.write(sourceAbsPath, SOURCE);
  opts = {
    cursorModel: "unused",
    engine: "codex",
    engineTimeoutMs: 0,
    glossaryPath: join(dir, "glossary.db"),
    kiroClient: undefined,
    modelLabel: "gpt-test",
    reasoningEffort: "medium",
    scopeDir: dir,
    targetLang: "zh-TW",
  };
});

const run = (runner: EngineRunner) =>
  runChunkedWithRetry({
    chunks,
    glossaryTerms: ["Claude Code"],
    opts,
    outputAbsPath,
    runner,
    slug: SLUG,
    sourceAbsPath,
  });

describe("useChunkedMode", () => {
  const big = "x".repeat(STRUCTURED_MAX_SOURCE_BYTES + 1);

  it("takes over from the agentic fallback for codex above the ceiling", () => {
    expect(useStructuredMode("codex", big)).toBe(false);
    expect(useChunkedMode("codex", big)).toBe(true);
    expect(useChunkedMode("codex", "small")).toBe(false);
  });

  it("is off for every non-codex engine, which keeps the agentic path", () => {
    for (const engine of ["claude", "agy", "kiro", "cursor"] as const) {
      expect(useChunkedMode(engine, big)).toBe(false);
    }
  });
});

describe("runChunkedWithRetry", () => {
  it("makes one structured call per part and writes the reassembled article", async () => {
    expect(chunks.length).toBeGreaterThan(2);
    const calls: FakeCall[] = [];
    const outcome = await run(fakeRunner(calls));

    expect(outcome.ok).toBe(true);
    expect(calls.map((c) => c.part)).toEqual(chunks.map((_, i) => i + 1));
    expect(calls.every((c) => c.total === chunks.length)).toBe(true);
    const output = await Bun.file(outputAbsPath).text();
    expect(output).toBe(fakeTranslate(SOURCE));
    expect(output.match(/^---$/gm)).toHaveLength(2);
  });

  it("tells only part 1 to emit frontmatter, and inlines the DNT glossary", async () => {
    const calls: FakeCall[] = [];
    await run(fakeRunner(calls));
    expect(calls[0].prompt).toContain("This is the FIRST part");
    expect(calls[1].prompt).toContain("This is a LATER part");
    expect(calls[1].prompt).toContain("must NOT start with `---`");
    for (const call of calls) {
      expect(call.prompt).toContain("\nClaude Code\n");
    }
  });

  it("sums the parts' usage into one record and collects every part's new terms", async () => {
    const outcome = await run(fakeRunner([]));
    if (!outcome.ok) {
      throw new Error(outcome.reason);
    }
    const k = chunks.length;
    expect(outcome.usage).toEqual({
      cachedInputTokens: 10 * k,
      cacheWriteInputTokens: 0,
      inputTokens: 100 * k,
      model: "gpt-test",
      outputTokens: 50 * k,
      reasoningOutputTokens: 5 * k,
    });
    expect(outcome.newTerms.map((t) => t.term)).toEqual(
      chunks.map((_, i) => `Term${i + 1}`)
    );
  });

  it("retries a failing part once with its errors, then fails the article and restores the prior translation", async () => {
    await Bun.write(outputAbsPath, "PRIOR TRANSLATION");
    const calls: FakeCall[] = [];
    // Part 2 drops its link on every attempt.
    const outcome = await run(
      fakeRunner(calls, (part, call) =>
        call.part === 2
          ? fakeTranslate(part).replace(/\]\([^)]*\)/g, "")
          : fakeTranslate(part)
      )
    );

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toMatch(FAILED_PART_2_RE);
      expect(outcome.reason).toMatch(LINK_ERROR_RE);
    }
    expect(calls.map((c) => c.part)).toEqual([1, 2, 2]);
    expect(calls[2].prompt).toContain("PREVIOUS ATTEMPT REJECTED");
    expect(await Bun.file(outputAbsPath).text()).toBe("PRIOR TRANSLATION");
  });

  it("recovers when a part's retry passes", async () => {
    const calls: FakeCall[] = [];
    let failedOnce = false;
    const outcome = await run(
      fakeRunner(calls, (part, call) => {
        if (call.part === 2 && !failedOnce) {
          failedOnce = true;
          return "not json-shaped mdx without the link";
        }
        return fakeTranslate(part);
      })
    );
    expect(outcome.ok).toBe(true);
    expect(calls.length).toBe(chunks.length + 1);
  });

  it("rejects a later part that re-emits frontmatter", async () => {
    const calls: FakeCall[] = [];
    const outcome = await run(
      fakeRunner(calls, (part, call) =>
        call.part === 2
          ? `---\ntitle: x\n---\n${fakeTranslate(part)}`
          : fakeTranslate(part)
      )
    );
    expect(outcome.ok).toBe(false);
  });

  it("runs the whole-article validation on the reassembled result", async () => {
    await Bun.write(outputAbsPath, "PRIOR TRANSLATION");
    // Untranslated parts pass the per-part checks (residual English is
    // whole-article only) — the reassembled article must still be rejected.
    const outcome = await run(fakeRunner([], (part) => part));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toMatch(MOSTLY_ENGLISH_RE);
    }
    expect(await Bun.file(outputAbsPath).text()).toBe("PRIOR TRANSLATION");
  });

  it("leaves no output behind when there was no prior translation", async () => {
    const outcome = await run(fakeRunner([], (part) => part));
    expect(outcome.ok).toBe(false);
    expect(await Bun.file(outputAbsPath).exists()).toBe(false);
  });
});

describe("sumUsages", () => {
  it("is undefined when no part reported usage", () => {
    expect(sumUsages([undefined, undefined])).toBeUndefined();
  });

  it("sums only the counters some part reported", () => {
    expect(
      sumUsages([{ inputTokens: 5 }, undefined, { inputTokens: 7, credits: 2 }])
    ).toEqual({ credits: 2, inputTokens: 12 });
  });
});
