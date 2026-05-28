import { describe, expect, it } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildSlugTitleMap,
  extractRawSlugsFromBody,
  extractRawSlugsFromSources,
  loadRawDoc,
  type ParsedWikiFile,
  parseIndexSummaries,
  parseWikiFile,
  resolveDate,
  stripWikilinksToText,
} from "../import-wiki/parse.ts";
import { titleFromSlug } from "../import-wiki/wikilink.ts";

async function tempFile(content: string, filename: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "wiki-test-"));
  const path = join(dir, filename);
  await writeFile(path, content, "utf8");
  return path;
}

describe("parseIndexSummaries", () => {
  it("extracts summaries from Concepts and Derived tables, skips Source Documents", async () => {
    const content = [
      "## Concepts",
      "",
      "| Page | Summary | Sources |",
      "|------|---------|---------|",
      "| [[claude-code]] | Anthropic's agentic coding product | 6 |",
      "| [[anthropic]] | AI safety company / vendor of Claude | 4 |",
      "",
      "## Derived",
      "",
      "| Page | Summary | Date |",
      "|------|---------|------|",
      "| [[wiki/derived/what-are-ai-tools]] | Overview of AI tools | 2026-04-10 |",
      "",
      "## Source Documents",
      "",
      "| Document | Source | Ingested | Category |",
      "|----------|--------|----------|----------|",
      "| [[raw/llm-wiki]] | [Karpathy](https://x) | 2026-04-10 | LLM Architecture |",
      "",
    ].join("\n");
    const path = await tempFile(content, "index.md");
    const summaries = await parseIndexSummaries(path);

    expect(summaries.get("claude-code")).toBe(
      "Anthropic's agentic coding product"
    );
    expect(summaries.get("anthropic")).toBe(
      "AI safety company / vendor of Claude"
    );
    expect(summaries.get("what-are-ai-tools")).toBe("Overview of AI tools");
    expect(summaries.has("llm-wiki")).toBe(false);
  });
});

describe("parseWikiFile", () => {
  it("parses YAML frontmatter and body", async () => {
    const content = [
      "---",
      'title: "Claude Code"',
      "type: entity",
      "created: 2026-05-06",
      "updated: 2026-05-10",
      "---",
      "",
      "# Claude Code",
      "",
      "Body content.",
    ].join("\n");
    const path = await tempFile(content, "claude-code.md");
    const parsed = await parseWikiFile({
      slug: "claude-code",
      folder: "concepts",
      absolutePath: path,
    });
    expect(parsed.frontmatter.title).toBe("Claude Code");
    expect(parsed.frontmatter.created).toBe("2026-05-06");
    expect(parsed.body).toContain("Body content.");
  });

  it("drops a boolean `generated` flag so resolveDate falls back", async () => {
    const content = [
      "---",
      'title: "Open Questions Backlog"',
      "type: derived",
      "generated: true",
      "updated: 2026-05-25",
      "---",
      "",
      "Body content.",
    ].join("\n");
    const path = await tempFile(content, "open-questions.md");
    const parsed = await parseWikiFile({
      slug: "open-questions",
      folder: "derived",
      absolutePath: path,
    });
    expect(parsed.frontmatter.generated).toBeUndefined();
    expect(resolveDate(parsed)).toBe("2026-05-25");
  });
});

describe("resolveDate", () => {
  function fixture(overrides: Partial<ParsedWikiFile>): ParsedWikiFile {
    return {
      source: {
        slug: "test",
        folder: "concepts",
        absolutePath: "/tmp/test.md",
      },
      frontmatter: {},
      body: "",
      mtime: new Date("2026-01-01"),
      ...overrides,
    };
  }

  it("prefers `created` for concepts", () => {
    const date = resolveDate(
      fixture({
        frontmatter: { created: "2026-05-06", updated: "2026-05-10" },
      })
    );
    expect(date).toBe("2026-05-06");
  });

  it("prefers `generated` for derived", () => {
    const date = resolveDate(
      fixture({
        source: {
          slug: "x",
          folder: "derived",
          absolutePath: "/tmp/x.md",
        },
        frontmatter: { generated: "2026-04-10", updated: "2026-04-15" },
      })
    );
    expect(date).toBe("2026-04-10");
  });

  it("falls back to `updated` when primary is missing", () => {
    const date = resolveDate(
      fixture({ frontmatter: { updated: "2026-05-09" } })
    );
    expect(date).toBe("2026-05-09");
  });

  it("falls back to mtime when no frontmatter dates are present", () => {
    const date = resolveDate(
      fixture({ mtime: new Date("2025-12-25T12:00:00Z") })
    );
    expect(date).toBe("2025-12-25");
  });
});

describe("buildSlugTitleMap + titleFromSlug", () => {
  it("titleFromSlug capitalises hyphenated slugs", () => {
    expect(titleFromSlug("claude-code-best-practices")).toBe(
      "Claude Code Best Practices"
    );
  });

  it("buildSlugTitleMap falls back to titleFromSlug when no frontmatter title", () => {
    const map = buildSlugTitleMap([
      {
        source: {
          slug: "foo",
          folder: "concepts",
          absolutePath: "/tmp/foo.md",
        },
        frontmatter: {},
        body: "",
        mtime: new Date(),
      },
      {
        source: {
          slug: "bar",
          folder: "concepts",
          absolutePath: "/tmp/bar.md",
        },
        frontmatter: { title: "Bar Page" },
        body: "",
        mtime: new Date(),
      },
    ]);
    expect(map.get("foo")).toBe("Foo");
    expect(map.get("bar")).toBe("Bar Page");
  });
});

describe("extractRawSlugsFromSources", () => {
  it("returns the bare slug for each [[raw/...]] entry in order", () => {
    expect(
      extractRawSlugsFromSources([
        "[[raw/anthropics-boris-cherny-why-coding-is-solved]]",
        "[[raw/Introducing Claude Opus 4.7]]",
      ])
    ).toEqual([
      "anthropics-boris-cherny-why-coding-is-solved",
      "Introducing Claude Opus 4.7",
    ]);
  });

  it("skips [[wiki/...]] internal references", () => {
    expect(
      extractRawSlugsFromSources([
        "[[wiki/concepts/printing-press-software-democratization]]",
        "[[raw/llm-wiki]]",
      ])
    ).toEqual(["llm-wiki"]);
  });

  it("preserves sub-paths inside raw/ (Obsidian allows subdirectories)", () => {
    expect(
      extractRawSlugsFromSources([
        "[[raw/Claude Mythos Preview / red.anthropic.com]]",
      ])
    ).toEqual(["Claude Mythos Preview / red.anthropic.com"]);
  });

  it("deduplicates while preserving author order", () => {
    expect(
      extractRawSlugsFromSources(["[[raw/a]]", "[[raw/b]]", "[[raw/a]]"])
    ).toEqual(["a", "b"]);
  });

  it("returns [] when sources is undefined", () => {
    expect(extractRawSlugsFromSources(undefined)).toEqual([]);
  });
});

describe("extractRawSlugsFromBody", () => {
  it("yields every [[raw/...]] occurrence in source order, including duplicates", () => {
    const body =
      "See [[raw/foo]] and again [[raw/foo]]. Compare to [[wiki/concepts/bar]] and [[raw/baz]].";
    expect(extractRawSlugsFromBody(body)).toEqual(["foo", "foo", "baz"]);
  });
});

describe("loadRawDoc", () => {
  it("extracts title and http(s) source URL from frontmatter", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wiki-raw-"));
    const slug = "boris-cherny";
    await writeFile(
      join(dir, `${slug}.md`),
      [
        "---",
        'title: "Boris Cherny: Why Coding Is Solved"',
        'source: "https://www.youtube.com/watch?v=SlGRN8jh2RI"',
        "---",
        "",
        "Body content.",
      ].join("\n"),
      "utf8"
    );

    const doc = await loadRawDoc(dir, slug);
    expect(doc).toEqual({
      slug,
      title: "Boris Cherny: Why Coding Is Solved",
      url: "https://www.youtube.com/watch?v=SlGRN8jh2RI",
    });
  });

  it("returns url=undefined when frontmatter source is empty", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wiki-raw-"));
    const slug = "no-url";
    await writeFile(
      join(dir, `${slug}.md`),
      ["---", 'title: "Untitled Clipping"', 'source: ""', "---", ""].join("\n"),
      "utf8"
    );

    const doc = await loadRawDoc(dir, slug);
    expect(doc).toEqual({ slug, title: "Untitled Clipping", url: undefined });
  });

  it("rejects non-http(s) source URLs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wiki-raw-"));
    const slug = "weird";
    await writeFile(
      join(dir, `${slug}.md`),
      [
        "---",
        'title: "Weird"',
        'source: "file:///Users/howard/secret.pdf"',
        "---",
      ].join("\n"),
      "utf8"
    );

    const doc = await loadRawDoc(dir, slug);
    expect(doc?.url).toBeUndefined();
  });

  it("falls back to humanised slug when frontmatter has no title", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wiki-raw-"));
    const slug = "my-clipping-with-dashes";
    await writeFile(
      join(dir, `${slug}.md`),
      ["---", 'source: "https://example.com/"', "---"].join("\n"),
      "utf8"
    );

    const doc = await loadRawDoc(dir, slug);
    expect(doc?.title).toBe("my clipping with dashes");
  });

  it("returns null when the file is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wiki-raw-"));
    expect(await loadRawDoc(dir, "missing")).toBeNull();
  });
});

describe("stripWikilinksToText", () => {
  it("replaces a bare wikilink with the title-cased slug", () => {
    expect(stripWikilinksToText("see [[model-spec-midtraining]]")).toBe(
      "see Model Spec Midtraining"
    );
  });

  it("uses an explicit label when present", () => {
    expect(stripWikilinksToText("[[claude-code|Claude]]")).toBe("Claude");
  });

  it("strips raw/ prefix and humanises the rest", () => {
    expect(stripWikilinksToText("[[raw/Best Practices for Claude]]")).toBe(
      "Best Practices for Claude"
    );
  });

  it("leaves text without wikilinks unchanged", () => {
    expect(stripWikilinksToText("nothing to do here")).toBe(
      "nothing to do here"
    );
  });
});
