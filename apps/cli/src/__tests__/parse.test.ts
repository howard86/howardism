import { describe, expect, it } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildSlugTitleMap,
  type ParsedWikiFile,
  parseIndexSummaries,
  parseWikiFile,
  resolveDate,
  stripWikilinksToText,
  titleFromSlug,
} from "../import-wiki/parse.ts";

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
