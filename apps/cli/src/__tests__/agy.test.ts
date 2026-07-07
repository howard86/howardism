import { describe, expect, it } from "bun:test";
import { stat } from "node:fs/promises";
import { join } from "node:path";

import { buildPrompt, generateHeroImage } from "../import-wiki/agy/index.ts";

const NOT_A_PNG_RE = /not a PNG/;
const DID_NOT_PRODUCE_RE = /did not produce/;
const PNG_HEADER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);
const noopRunner = () => Promise.resolve({ stdout: "", stderr: "" });

describe("agy buildPrompt", () => {
  it("includes the title, output path, $imagegen instruction, and truncated excerpt", () => {
    const prompt = buildPrompt({
      title: "Claude Code",
      body: "Long body content. ".repeat(200),
      outputPath: "/abs/path/claude-code.png",
    });

    expect(prompt).toContain("Title: Claude Code");
    expect(prompt).toContain("$imagegen");
    expect(prompt).toContain("/abs/path/claude-code.png");
    expect(prompt).toContain("1600x900 PNG");
    expect(prompt.length).toBeLessThan(2400);
  });
});

describe("agy generateHeroImage", () => {
  it("dry-run does not call the runner", async () => {
    let runnerCalls = 0;
    await generateHeroImage({
      title: "Demo",
      body: "Body",
      outputPath: "/tmp/should-not-exist.png",
      stagingDir: "/tmp",
      dryRun: true,
      runner: () => {
        runnerCalls += 1;
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    });
    expect(runnerCalls).toBe(0);
  });

  it("stages the PNG in stagingDir, then moves it to outputPath", async () => {
    const stamp = Date.now();
    const stagingDir = `/tmp/agy-staging-${stamp}`;
    const filename = `agy-test-${stamp}.png`;
    const stagingPath = join(stagingDir, filename);
    const finalDir = `/tmp/agy-final-${stamp}`;
    const finalPath = join(finalDir, filename);

    let capturedPrompt = "";
    await generateHeroImage({
      title: "Demo",
      body: "Body",
      outputPath: finalPath,
      stagingDir,
      runner: async (prompt) => {
        capturedPrompt = prompt;
        // Simulate agy writing the PNG into the sandbox-writable staging dir.
        await Bun.write(stagingPath, PNG_HEADER);
        return { stdout: stagingPath, stderr: "" };
      },
    });

    expect(capturedPrompt).toContain("Title: Demo");
    expect(capturedPrompt).toContain(stagingPath);
    expect(capturedPrompt).not.toContain(finalPath);

    const finalInfo = await stat(finalPath);
    expect(finalInfo.size).toBeGreaterThan(0);
    await expect(stat(stagingPath)).rejects.toThrow();
  });

  it("throws when the staged output is not a valid PNG", async () => {
    const stamp = Date.now();
    const stagingDir = `/tmp/agy-staging-bad-${stamp}`;
    const filename = `agy-test-bad-${stamp}.png`;
    await Bun.write(join(stagingDir, filename), "not a png");

    await expect(
      generateHeroImage({
        title: "Demo",
        body: "Body",
        outputPath: `/tmp/agy-final-bad-${stamp}/${filename}`,
        stagingDir,
        runner: noopRunner,
      })
    ).rejects.toThrow(NOT_A_PNG_RE);
  });

  it("throws when the staged file is missing", async () => {
    const stamp = Date.now();
    await expect(
      generateHeroImage({
        title: "Demo",
        body: "Body",
        outputPath: `/tmp/agy-final-missing-${stamp}/missing.png`,
        stagingDir: `/tmp/agy-staging-missing-${stamp}`,
        runner: noopRunner,
      })
    ).rejects.toThrow(DID_NOT_PRODUCE_RE);
  });
});
