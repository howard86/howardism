import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildManifests,
  writeManifests,
} from "../import-wiki/pages/manifests.ts";
import type { ParsedWikiFile } from "../import-wiki/parse.ts";

function makeParsed(
  slug: string,
  body: string,
  overrides: Partial<ParsedWikiFile> = {}
): ParsedWikiFile {
  return {
    source: { slug, folder: "concepts", absolutePath: `/tmp/${slug}.md` },
    frontmatter: {},
    body,
    mtime: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("buildManifests", () => {
  it("is deterministic: same inputs produce identical JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifests-det-"));
    const args = {
      parsed: [makeParsed("a", "[[b]]"), makeParsed("b", "[[a]]")],
      logBody: "## [2026-05-01] ingest | Test\nSome body [[a]]",
      rawRoot: dir,
      generatedOn: "2026-05-14",
    };

    const a = await buildManifests(args);
    const b = await buildManifests(args);

    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("threads generatedOn to all three manifests", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifests-gen-"));
    const set = await buildManifests({
      parsed: [makeParsed("x", "")],
      logBody: "## [2026-05-01] ingest | X\nbody",
      rawRoot: dir,
      generatedOn: "2026-05-14",
    });

    expect(set.graph.generatedOn).toBe("2026-05-14");
    expect(set.log?.generatedOn).toBe("2026-05-14");
    expect(set.sources.generatedOn).toBe("2026-05-14");
  });

  it("excludes archived articles from graph and sources", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifests-arch-"));
    const set = await buildManifests({
      parsed: [
        makeParsed("live", ""),
        makeParsed("dead", "", { frontmatter: { archived: true } }),
      ],
      logBody: null,
      rawRoot: dir,
      generatedOn: "2026-05-14",
    });

    expect(Object.keys(set.graph.outgoing)).toEqual(["live"]);
    expect(set.log).toBeNull();
  });

  it("returns null log when logBody is null", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifests-nolog-"));
    const set = await buildManifests({
      parsed: [makeParsed("a", "")],
      logBody: null,
      rawRoot: dir,
      generatedOn: "2026-05-14",
    });

    expect(set.log).toBeNull();
  });
});

describe("writeManifests", () => {
  it("writes three files and returns graphPath", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifests-write-"));
    const graphPath = join(dir, "graph.json");
    const logPath = join(dir, "log.json");
    const sourcesPath = join(dir, "sources.json");

    const set = await buildManifests({
      parsed: [makeParsed("a", "[[b]]"), makeParsed("b", "")],
      logBody: "## [2026-05-01] ingest | Test\nbody [[a]]",
      rawRoot: dir,
      generatedOn: "2026-05-14",
    });

    const result = await writeManifests({
      set,
      graphOutputPath: graphPath,
      logOutputPath: logPath,
      sourcesOutputPath: sourcesPath,
      dryRun: false,
    });

    expect(result.graphPath).toBe(graphPath);
    const graphData = JSON.parse(await readFile(graphPath, "utf8"));
    expect(graphData.generatedOn).toBe("2026-05-14");
    const logData = JSON.parse(await readFile(logPath, "utf8"));
    expect(logData.generatedOn).toBe("2026-05-14");
    const sourcesData = JSON.parse(await readFile(sourcesPath, "utf8"));
    expect(sourcesData.generatedOn).toBe("2026-05-14");
  });

  it("dry-run writes no files but returns graphPath", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifests-dry-"));
    const graphPath = join(dir, "graph.json");
    const logPath = join(dir, "log.json");
    const sourcesPath = join(dir, "sources.json");

    const set = await buildManifests({
      parsed: [makeParsed("a", "")],
      logBody: "## [2026-05-01] ingest | X\nbody",
      rawRoot: dir,
      generatedOn: "2026-05-14",
    });

    const result = await writeManifests({
      set,
      graphOutputPath: graphPath,
      logOutputPath: logPath,
      sourcesOutputPath: sourcesPath,
      dryRun: true,
    });

    expect(result.graphPath).toBe(graphPath);
    await expect(stat(graphPath)).rejects.toThrow();
    await expect(stat(logPath)).rejects.toThrow();
    await expect(stat(sourcesPath)).rejects.toThrow();
  });
});
