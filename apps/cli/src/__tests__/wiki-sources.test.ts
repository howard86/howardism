import { describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildWikiSources } from "../import-wiki/pages/wiki-sources.ts";
import type { ParsedWikiFile } from "../import-wiki/parse.ts";

function makeParsed(
  slug: string,
  sources: string[],
  overrides: Partial<ParsedWikiFile> = {}
): ParsedWikiFile {
  return {
    source: { slug, folder: "concepts", absolutePath: `/tmp/${slug}.md` },
    frontmatter: { sources },
    body: "",
    mtime: new Date("2026-01-01"),
    ...overrides,
  };
}

async function writeRawDoc(
  rawRoot: string,
  slug: string,
  frontmatter: Record<string, string>
): Promise<void> {
  const dir = join(rawRoot, ...slug.split("/").slice(0, -1));
  if (dir !== rawRoot) {
    await mkdir(dir, { recursive: true });
  }
  const lines = ["---"];
  for (const [k, v] of Object.entries(frontmatter)) {
    lines.push(`${k}: ${v}`);
  }
  lines.push("---", "", "Body content.");
  await writeFile(join(rawRoot, `${slug}.md`), lines.join("\n"), "utf8");
}

describe("buildWikiSources", () => {
  it("sorts by citedBy count desc, then published desc, then title asc", async () => {
    const rawRoot = await mkdtemp(join(tmpdir(), "ws-sort-"));
    await writeRawDoc(rawRoot, "many-cites", {
      title: "Many Cites",
      source: "https://example.com/many",
      published: "2020-01-01",
    });
    await writeRawDoc(rawRoot, "one-cite-new", {
      title: "One Cite New",
      source: "https://example.com/new",
      published: "2025-01-01",
    });
    await writeRawDoc(rawRoot, "one-cite-old", {
      title: "One Cite Old",
      source: "https://example.com/old",
      published: "2020-01-01",
    });

    const parsed = [
      makeParsed("a", ["[[raw/many-cites]]", "[[raw/one-cite-new]]"]),
      makeParsed("b", ["[[raw/many-cites]]", "[[raw/one-cite-old]]"]),
    ];

    const manifest = await buildWikiSources({
      parsed,
      rawRoot,
      generatedOn: "2026-05-14",
    });

    expect(manifest.sources.map((s) => s.title)).toEqual([
      "Many Cites",
      "One Cite New",
      "One Cite Old",
    ]);
  });

  it("sorts citedBy alphabetically", async () => {
    const rawRoot = await mkdtemp(join(tmpdir(), "ws-cited-"));
    await writeRawDoc(rawRoot, "src", {
      title: "Source",
      source: "https://example.com",
    });

    const parsed = [
      makeParsed("zebra", ["[[raw/src]]"]),
      makeParsed("alpha", ["[[raw/src]]"]),
    ];

    const manifest = await buildWikiSources({
      parsed,
      rawRoot,
      generatedOn: "2026-05-14",
    });

    expect(manifest.sources[0].citedBy).toEqual(["alpha", "zebra"]);
  });

  it("classifies URL to kind correctly", async () => {
    const rawRoot = await mkdtemp(join(tmpdir(), "ws-kind-"));
    await writeRawDoc(rawRoot, "talk", {
      title: "Talk",
      source: "https://youtube.com/watch?v=123",
    });
    await writeRawDoc(rawRoot, "paper", {
      title: "Paper",
      source: "https://arxiv.org/abs/123",
    });
    await writeRawDoc(rawRoot, "repo", {
      title: "Repo",
      source: "https://github.com/user/repo",
    });
    await writeRawDoc(rawRoot, "article", {
      title: "Article",
      source: "https://blog.example.com/post",
    });
    await writeRawDoc(rawRoot, "note", { title: "Note" });

    const parsed = [
      makeParsed("x", [
        "[[raw/talk]]",
        "[[raw/paper]]",
        "[[raw/repo]]",
        "[[raw/article]]",
        "[[raw/note]]",
      ]),
    ];

    const manifest = await buildWikiSources({
      parsed,
      rawRoot,
      generatedOn: "2026-05-14",
    });

    const byTitle = new Map(manifest.sources.map((s) => [s.title, s.kind]));
    expect(byTitle.get("Talk")).toBe("Talk");
    expect(byTitle.get("Paper")).toBe("Paper");
    expect(byTitle.get("Repo")).toBe("Repo");
    expect(byTitle.get("Article")).toBe("Article");
    expect(byTitle.get("Note")).toBe("Note");
  });

  it("sets generatedOn as date-only string", async () => {
    const rawRoot = await mkdtemp(join(tmpdir(), "ws-gen-"));
    const manifest = await buildWikiSources({
      parsed: [makeParsed("a", [])],
      rawRoot,
      generatedOn: "2026-05-14",
    });

    expect(manifest.generatedOn).toBe("2026-05-14");
  });
});
