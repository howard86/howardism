import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { WikiDomain } from "@howardism/article-contract";
import {
  buildManifests,
  writeManifests,
} from "../import-wiki/pages/manifests.ts";
import type { ParsedWikiFile } from "../import-wiki/parse.ts";

const EMPTY_MEMBERSHIP: ReadonlyMap<string, WikiDomain> = new Map();
const EMPTY_TITLES: ReadonlyMap<string, string> = new Map();

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

function buildArgs(parsed: ParsedWikiFile[], rawRoot: string) {
  return {
    parsed,
    rawRoot,
    generatedOn: "2026-05-14",
    membership: EMPTY_MEMBERSHIP,
    slugTitleMap: EMPTY_TITLES,
  };
}

describe("buildManifests", () => {
  it("is deterministic: same inputs produce identical JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifests-det-"));
    const args = buildArgs(
      [makeParsed("a", "[[b]]"), makeParsed("b", "[[a]]")],
      dir
    );

    const a = await buildManifests(args);
    const b = await buildManifests(args);

    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("threads generatedOn to all manifests", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifests-gen-"));
    const set = await buildManifests(buildArgs([makeParsed("x", "")], dir));

    expect(set.graph.generatedOn).toBe("2026-05-14");
    expect(set.sources.generatedOn).toBe("2026-05-14");
    expect(set.openQuestions.generatedOn).toBe("2026-05-14");
  });

  it("harvests the open-questions backlog grouped by concept", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifests-oq-"));
    const backlog = makeParsed(
      "open-questions",
      "## [[agent-loop-pattern]]\n- Who owns the budget?\n- Still need a backlog?\n",
      {
        source: {
          slug: "open-questions",
          folder: "derived",
          absolutePath: "/tmp/oq.md",
        },
      }
    );
    const set = await buildManifests(buildArgs([backlog], dir));

    expect(set.openQuestions.byConcept).toHaveLength(1);
    expect(set.openQuestions.byConcept[0]).toMatchObject({
      slug: "agent-loop-pattern",
      domain: "syntheses",
      questions: ["Who owns the budget?", "Still need a backlog?"],
    });
  });

  it("harvests concepts nested under domain sections, ignoring flat sections", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifests-oq-nested-"));
    const backlog = makeParsed(
      "open-questions",
      [
        "## Actionable by domain",
        "",
        "### agent-systems (2 open)",
        "",
        "#### [[agent-loop-pattern]]",
        "",
        "- Who owns the budget? #oq/source",
        "",
        "## Predictions — `#oq/wait` (79)",
        "",
        "- [[agent-context-files]]: Will the role split converge?",
      ].join("\n"),
      {
        source: {
          slug: "open-questions",
          folder: "derived",
          absolutePath: "/tmp/oq.md",
        },
      }
    );
    const set = await buildManifests(buildArgs([backlog], dir));

    // The flat `## Predictions` bullet has no concept heading of its own, so it
    // must not be appended to the last concept seen.
    expect(set.openQuestions.byConcept).toHaveLength(1);
    expect(set.openQuestions.byConcept[0]).toMatchObject({
      slug: "agent-loop-pattern",
      questions: ["Who owns the budget?"],
    });
  });

  it("excludes archived articles from graph and sources", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifests-arch-"));
    const set = await buildManifests(
      buildArgs(
        [
          makeParsed("live", ""),
          makeParsed("dead", "", { frontmatter: { archived: true } }),
        ],
        dir
      )
    );

    expect(Object.keys(set.graph.outgoing)).toEqual(["live"]);
  });
});

describe("writeManifests", () => {
  it("writes all files and returns graphPath", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifests-write-"));
    const graphPath = join(dir, "graph.json");
    const sourcesPath = join(dir, "sources.json");
    const openQuestionsPath = join(dir, "open-questions.json");

    const set = await buildManifests(
      buildArgs([makeParsed("a", "[[b]]"), makeParsed("b", "")], dir)
    );

    const result = await writeManifests({
      set,
      graphOutputPath: graphPath,
      sourcesOutputPath: sourcesPath,
      openQuestionsOutputPath: openQuestionsPath,
      dryRun: false,
    });

    expect(result.graphPath).toBe(graphPath);
    const graphData = JSON.parse(await readFile(graphPath, "utf8"));
    expect(graphData.generatedOn).toBe("2026-05-14");
    const sourcesData = JSON.parse(await readFile(sourcesPath, "utf8"));
    expect(sourcesData.generatedOn).toBe("2026-05-14");
    const oqData = JSON.parse(await readFile(openQuestionsPath, "utf8"));
    expect(oqData.generatedOn).toBe("2026-05-14");
  });

  it("dry-run writes no files but returns graphPath", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifests-dry-"));
    const graphPath = join(dir, "graph.json");
    const sourcesPath = join(dir, "sources.json");
    const openQuestionsPath = join(dir, "open-questions.json");

    const set = await buildManifests(buildArgs([makeParsed("a", "")], dir));

    const result = await writeManifests({
      set,
      graphOutputPath: graphPath,
      sourcesOutputPath: sourcesPath,
      openQuestionsOutputPath: openQuestionsPath,
      dryRun: true,
    });

    expect(result.graphPath).toBe(graphPath);
    await expect(stat(graphPath)).rejects.toThrow();
    await expect(stat(sourcesPath)).rejects.toThrow();
    await expect(stat(openQuestionsPath)).rejects.toThrow();
  });
});
