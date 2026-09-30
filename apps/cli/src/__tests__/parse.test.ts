import { describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { titleFromSlug } from "@howardism/article-contract/markup";
import matter from "gray-matter";

import {
  buildSlugTitleMap,
  discoverWikiSources,
  extractRawSlugsFromBody,
  extractRawSlugsFromSources,
  loadRawDoc,
  type ParsedWikiFile,
  parseAndValidateVault,
  parseWikiFile,
  resolveDate,
  stripWikilinksToText,
} from "../import-wiki/parse.ts";

const UNPARSEABLE_RAW_ERROR = /unescaped-quotes\.md: unparseable frontmatter/;
const DUP_RAW_ERROR =
  /dup-raw\.md: unparseable frontmatter — duplicated mapping key \(line 5\)\. .*raw\/ document/;

/** gray-matter's process-wide parse cache; absent from its type declarations. */
const matterInternals = matter as unknown as {
  cache: Record<string, unknown>;
  clearCache: () => void;
};

async function tempFile(content: string, filename: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "wiki-test-"));
  const path = join(dir, filename);
  await writeFile(path, content, "utf8");
  return path;
}

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

  it("parses `summary`, `domain`, `kind`, and `date` frontmatter", async () => {
    const content = [
      "---",
      'title: "Andrej Karpathy"',
      "type: entity",
      "kind: person",
      "domain: agent-systems",
      'summary: "Founding member of OpenAI and former Tesla AI lead."',
      "date: 2026-05-06",
      "---",
      "",
      "Body content.",
    ].join("\n");
    const path = await tempFile(content, "andrej-karpathy.md");
    const parsed = await parseWikiFile({
      slug: "andrej-karpathy",
      folder: "concepts",
      absolutePath: path,
    });
    expect(parsed.frontmatter.summary).toBe(
      "Founding member of OpenAI and former Tesla AI lead."
    );
    expect(parsed.frontmatter.domain).toBe("agent-systems");
    expect(parsed.frontmatter.kind).toBe("person");
    expect(parsed.frontmatter.date).toBe("2026-05-06");
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
    expect(parsed.isGenerated).toBe(true);
    expect(resolveDate(parsed)).toBe("2026-05-25");
  });

  it("sets isGenerated to false when frontmatter has no generated flag", async () => {
    const content = [
      "---",
      'title: "Claude Code"',
      "---",
      "",
      "Body content.",
    ].join("\n");
    const path = await tempFile(content, "claude-code.md");
    const parsed = await parseWikiFile({
      slug: "claude-code",
      folder: "concepts",
      absolutePath: path,
    });
    expect(parsed.isGenerated).toBe(false);
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
      isGenerated: false,
      ...overrides,
    };
  }

  function derivedFixture(overrides: Partial<ParsedWikiFile>): ParsedWikiFile {
    return fixture({
      source: { slug: "x", folder: "derived", absolutePath: "/tmp/x.md" },
      ...overrides,
    });
  }

  it("prefers `created` for concepts", () => {
    const date = resolveDate(
      fixture({
        frontmatter: { created: "2026-05-06", updated: "2026-05-10" },
      })
    );
    expect(date).toBe("2026-05-06");
  });

  it("does not consult `date` for concepts", () => {
    const date = resolveDate(
      fixture({
        frontmatter: { date: "2026-01-01", created: "2026-05-06" },
      })
    );
    expect(date).toBe("2026-05-06");
  });

  it("prefers `date` for derived", () => {
    const date = resolveDate(
      derivedFixture({
        frontmatter: {
          date: "2026-04-01",
          generated: "2026-04-10",
          created: "2026-03-01",
          updated: "2026-04-15",
        },
      })
    );
    expect(date).toBe("2026-04-01");
  });

  it("falls back to `generated` for derived when `date` is missing", () => {
    const date = resolveDate(
      derivedFixture({
        frontmatter: { generated: "2026-04-10", updated: "2026-04-15" },
      })
    );
    expect(date).toBe("2026-04-10");
  });

  it("falls back to `created` for derived when `date`/`generated` are missing", () => {
    const date = resolveDate(
      derivedFixture({
        frontmatter: { created: "2026-03-01", updated: "2026-04-15" },
      })
    );
    expect(date).toBe("2026-03-01");
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
        isGenerated: false,
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
        isGenerated: false,
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

  it("names the offending file when the frontmatter will not parse", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wiki-raw-"));
    const slug = "unescaped-quotes";
    await writeFile(
      join(dir, `${slug}.md`),
      // An unescaped `"` inside a double-quoted value: YAML ends the scalar
      // early and chokes on the rest of the line.
      [
        "---",
        'description: "his bar is "what have you built"; that is all"',
        "---",
      ].join("\n"),
      "utf8"
    );

    await expect(loadRawDoc(dir, slug)).rejects.toThrow(UNPARSEABLE_RAW_ERROR);
  });

  it("reads each raw doc once and serves later calls from the memo", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wiki-raw-"));
    const slug = "memoised";
    const path = join(dir, `${slug}.md`);
    await writeFile(
      path,
      ["---", 'title: "Read Once"', "---"].join("\n"),
      "utf8"
    );

    const first = await loadRawDoc(dir, slug);
    // Removing the file makes a second read impossible, so an identical
    // result can only have come from the memo.
    await rm(path);
    expect(await loadRawDoc(dir, slug)).toBe(first);
  });
});

describe("gray-matter parse cache", () => {
  it("stays empty — both parsers pass an options object", async () => {
    matterInternals.clearCache();
    const wikiPath = await tempFile(
      ["---", 'title: "Cached?"', "---", "", "Body."].join("\n"),
      "cached.md"
    );
    await parseWikiFile({
      slug: "cached",
      folder: "concepts",
      absolutePath: wikiPath,
    });

    const dir = await mkdtemp(join(tmpdir(), "wiki-raw-"));
    await writeFile(
      join(dir, "clipping.md"),
      ["---", 'title: "Clipping"', "---"].join("\n"),
      "utf8"
    );
    await loadRawDoc(dir, "clipping");

    expect(Object.keys(matterInternals.cache)).toHaveLength(0);
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

describe("frontmatter errors", () => {
  const DUP_TAGS = "---\ntitle: a\ntags: [x]\n\ntags: y\n---\nbody";
  const BAD_QUOTES = '---\nsummary: "a "b" c"\n---\nbody';

  it("names the wiki note and gives a clean reason with the file line", async () => {
    const path = await tempFile(DUP_TAGS, "dup-tags.md");
    const failure = await parseWikiFile({
      slug: "dup-tags",
      folder: "concepts",
      absolutePath: path,
    }).catch((err: Error) => err);
    expect(failure).toBeInstanceOf(Error);
    const { message } = failure as Error;
    expect(message).toContain(`${path}: unparseable frontmatter`);
    expect(message).toContain("duplicated mapping key (line 5)");
    expect(message).toContain("wiki note");
    expect(message).not.toContain("column");
  });

  it("gives raw docs the same clean line-number reason", async () => {
    const dir = await mkdtemp(join(tmpdir(), "wiki-raw-"));
    await writeFile(join(dir, "dup-raw.md"), DUP_TAGS, "utf8");
    await expect(loadRawDoc(dir, "dup-raw")).rejects.toThrow(DUP_RAW_ERROR);
  });

  it("parseAndValidateVault reports every bad note and raw doc at once", async () => {
    const root = await mkdtemp(join(tmpdir(), "wiki-vault-"));
    const wiki = join(root, "wiki", "concepts");
    const raw = join(root, "raw");
    await mkdir(wiki, { recursive: true });
    await mkdir(join(root, "wiki", "derived"), { recursive: true });
    await mkdir(raw, { recursive: true });
    await writeFile(join(wiki, "bad-note.md"), BAD_QUOTES, "utf8");
    await writeFile(
      join(wiki, "cites-bad-raw.md"),
      "---\ntitle: C\nsources:\n  - '[[raw/bad-raw]]'\n---\nSee [[bare-bad]].",
      "utf8"
    );
    await writeFile(join(wiki, "fine.md"), "---\ntitle: F\n---\nok", "utf8");
    await writeFile(join(raw, "bad-raw.md"), DUP_TAGS, "utf8");
    await writeFile(join(raw, "bare-bad.md"), BAD_QUOTES, "utf8");

    const sources = await discoverWikiSources(join(root, "wiki"));
    const failure = await parseAndValidateVault({
      sources,
      rawRoot: raw,
      onlySlug: null,
      concurrency: 4,
    }).catch((err: Error) => err);
    const { message } = failure as Error;
    expect(message).toContain("3 vault file(s) failed");
    expect(message).toContain("bad-note.md: unparseable");
    expect(message).toContain("bad-raw.md: unparseable");
    expect(message).toContain("bare-bad.md: unparseable");
    expect(message).toContain("(cited by cites-bad-raw)");

    // `--only fine` still fails on the unparseable note (the corpus is needed
    // for the slug map) but no longer on raw docs it does not cite.
    const scoped = await parseAndValidateVault({
      sources,
      rawRoot: raw,
      onlySlug: "fine",
      concurrency: 4,
    }).catch((err: Error) => err);
    expect((scoped as Error).message).toContain("1 vault file(s) failed");
    expect((scoped as Error).message).toContain("bad-note.md");
  });
});
