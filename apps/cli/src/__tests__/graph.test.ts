import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseArticleGraph,
  transpose,
} from "@howardism/article-contract/manifests/graph";
import {
  buildArticleGraph,
  emitArticleGraph,
} from "../import-wiki/pages/graph.ts";
import type { ParsedWikiFile } from "../import-wiki/parse.ts";
import { extractInternalSlugs } from "../import-wiki/wikilink.ts";

function makeParsed(
  slug: string,
  body: string,
  overrides: Partial<ParsedWikiFile> = {}
): ParsedWikiFile {
  return {
    source: {
      slug,
      folder: "concepts",
      absolutePath: `/tmp/${slug}.md`,
    },
    frontmatter: {},
    body,
    mtime: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("extractInternalSlugs", () => {
  it("extracts in-vault slugs and skips raw/, anchors, and pipe labels", () => {
    const body = [
      "See [[claude-code]] and [[Anthropic]] for context.",
      "Background: [[raw/something-external]] is not a slug.",
      "Anchor link: [[claude-code#Section]] still resolves to claude-code.",
      "Prefixed: [[wiki/derived/what-are-ai-tools]] strips folder.",
      "Pipe label: [[codex-app-server-protocol\\|Codex]] still extracts the target.",
    ].join("\n");

    expect(extractInternalSlugs(body)).toEqual([
      "claude-code",
      "anthropic",
      "claude-code",
      "what-are-ai-tools",
      "codex-app-server-protocol",
    ]);
  });

  it("returns an empty array for a body with no wikilinks", () => {
    expect(extractInternalSlugs("plain prose")).toEqual([]);
  });
});

describe("buildArticleGraph", () => {
  it("computes outgoing and backlinks for a 3-node graph", () => {
    const parsed = [
      makeParsed("a", "Link to [[b]] and [[c]]."),
      makeParsed("b", "Link back to [[a]]."),
      makeParsed("c", "Mentions [[b]]."),
    ];

    const graph = buildArticleGraph({
      parsed,
      generatedOn: "2026-05-14",
    });

    expect(graph.generatedOn).toBe("2026-05-14");
    expect(Object.fromEntries(transpose(graph.backlinks))).toEqual({
      a: ["b", "c"],
      b: ["a"],
      c: ["b"],
    });
    expect(graph.backlinks).toEqual({
      a: [{ slug: "b", count: 1 }],
      b: [
        { slug: "a", count: 1 },
        { slug: "c", count: 1 },
      ],
      c: [{ slug: "a", count: 1 }],
    });
  });

  it("dedupes repeated links, drops self-links, and drops unresolved targets", () => {
    const parsed = [
      makeParsed(
        "a",
        "[[b]] [[b]] [[a]] [[missing]] [[raw/external]] [[b#section]]"
      ),
      makeParsed("b", ""),
    ];

    const graph = buildArticleGraph({
      parsed,
      generatedOn: "2026-05-14",
    });

    const outgoing = transpose(graph.backlinks);
    expect(outgoing.get("a")).toEqual(["b"]);
    expect(outgoing.get("b")).toEqual([]);
    // Three live links to b (two bare, one anchored) collapse to one weighted edge.
    expect(graph.backlinks.b).toEqual([{ slug: "a", count: 3 }]);
  });

  it("excludes archived nodes entirely from outgoing, backlinks, and related", () => {
    const parsed = [
      makeParsed("a", "[[b]] [[c]]"),
      makeParsed("b", "[[a]] [[c]]"),
      makeParsed("c", "[[a]] [[b]]", {
        frontmatter: { archived: true },
      }),
    ];

    const graph = buildArticleGraph({
      parsed,
      generatedOn: "2026-05-14",
      isArchived: (p) => p.frontmatter.archived === true,
    });

    // c is archived → no entries for c anywhere, and links to c are dropped.
    const outgoing = transpose(graph.backlinks);
    expect([...outgoing.keys()].sort()).toEqual(["a", "b"]);
    expect(Object.keys(graph.backlinks).sort()).toEqual(["a", "b"]);
    expect(Object.keys(graph.related).sort()).toEqual(["a", "b"]);
    expect(outgoing.get("a")).toEqual(["b"]);
    expect(outgoing.get("b")).toEqual(["a"]);
    expect(graph.backlinks.a).toEqual([{ slug: "b", count: 1 }]);
    expect(graph.backlinks.b).toEqual([{ slug: "a", count: 1 }]);
  });

  it("ranks related[] by combined neighbor overlap, capped at 5", () => {
    // hub links to many; spokes link to hub.
    const parsed = [
      makeParsed("hub", "[[s1]] [[s2]] [[s3]] [[s4]] [[s5]] [[s6]]"),
      makeParsed("s1", "[[hub]]"),
      makeParsed("s2", "[[hub]]"),
      makeParsed("s3", "[[hub]]"),
      makeParsed("s4", "[[hub]]"),
      makeParsed("s5", "[[hub]]"),
      makeParsed("s6", "[[hub]]"),
    ];

    const graph = buildArticleGraph({
      parsed,
      generatedOn: "2026-05-14",
    });

    // Every spoke shares one outgoing target (hub) and one backlink source
    // (no — spokes have no backlinks from siblings). Co-link via outgoing
    // alone scores 1 per pair. Six spokes all tie at score 1; alphabetical
    // tiebreak takes s1..s5 for each spoke's related list.
    expect(graph.related.s1).toEqual(["s2", "s3", "s4", "s5", "s6"]);
    expect(graph.related.s6).toEqual(["s1", "s2", "s3", "s4", "s5"]);
    // hub has no other node with overlapping outgoing or backlinks.
    expect(graph.related.hub).toEqual([]);
  });

  it("ranks backlinks by citation weight and quotes the citing prose", () => {
    const prose =
      "The harness shrinks as models improve, which is exactly what [[b]] argues once you stop treating scaffolding as permanent.";
    const parsed = [
      makeParsed("light", "- [[b]]"),
      makeParsed("heavy", `${prose}\nAnd again, [[b]] twice over: [[b]].`),
      makeParsed("b", ""),
    ];

    const graph = buildArticleGraph({ parsed, generatedOn: "2026-05-14" });

    expect(graph.backlinks.b).toEqual([
      {
        slug: "heavy",
        count: 3,
        context:
          "The harness shrinks as models improve, which is exactly what B argues once you stop treating…",
      },
      // A bare list entry carries no prose, so it gets no quote.
      { slug: "light", count: 1 },
    ]);
  });

  it("breaks related ties alphabetically by slug", () => {
    // x and y both share one outgoing target (target). Tie at score 1.
    // x and y also share one backlink (source). Tie continues at 2.
    // Result: each appears in the other's related; alphabetical for tiebreak
    // doesn't matter with only two candidates, but the comparator is
    // exercised when extra unrelated nodes exist.
    const parsed = [
      makeParsed("source", "[[x]] [[y]]"),
      makeParsed("target", ""),
      makeParsed("x", "[[target]]"),
      makeParsed("y", "[[target]]"),
      makeParsed("z", "[[target]]"), // also shares the target → ties with x and y for source's related
    ];

    const graph = buildArticleGraph({
      parsed,
      generatedOn: "2026-05-14",
    });

    // x, y, z each have outgoing = [target], backlinks varies.
    // For x: shares target with y and z (overlap on outgoing=1 each); shares
    // backlink "source" with y (not z, since source doesn't link z) → x's
    // related: y (score 2), z (score 1).
    expect(graph.related.x).toEqual(["y", "z"]);
    expect(graph.related.y).toEqual(["x", "z"]);
    // z shares only target with x and y → both score 1. Alphabetical tiebreak: x first.
    expect(graph.related.z).toEqual(["x", "y"]);
  });
});

describe("emitArticleGraph", () => {
  it("writes a JSON file with the expected schema", async () => {
    const dir = await mkdtemp(join(tmpdir(), "graph-test-"));
    const outputPath = join(dir, "article-graph.json");

    const graph = buildArticleGraph({
      parsed: [makeParsed("a", "[[b]]"), makeParsed("b", "[[a]]")],
      generatedOn: "2026-05-14",
    });

    const written = await emitArticleGraph({
      graph,
      outputPath,
    });
    expect(written).toBe(outputPath);
    const info = await stat(outputPath);
    expect(info.size).toBeGreaterThan(0);

    const parsed = JSON.parse(await readFile(outputPath, "utf8"));
    expect(parsed.generatedOn).toBe("2026-05-14");
    expect(parsed.backlinks).toEqual({
      a: [{ slug: "b", count: 1 }],
      b: [{ slug: "a", count: 1 }],
    });
  });

  it("dry-run skips the write but returns the intended path", async () => {
    const outputPath = "/tmp/should-never-be-written-graph.json";
    const graph = buildArticleGraph({
      parsed: [makeParsed("a", "")],
      generatedOn: "2026-05-14",
    });

    const written = await emitArticleGraph({
      graph,
      outputPath,
      dryRun: true,
    });
    expect(written).toBe(outputPath);
    await expect(stat(outputPath)).rejects.toThrow();
  });
});

describe("parseArticleGraph", () => {
  it("normalises pre-weighting manifests that store bare backlink slugs", () => {
    const graph = parseArticleGraph({
      backlinks: { a: ["b", { slug: "c", count: 2, context: "prose" }] },
      related: {},
      generatedOn: "2026-05-14",
    });
    expect(graph.backlinks.a).toEqual([
      { slug: "b", count: 1 },
      { slug: "c", count: 2, context: "prose" },
    ]);
  });
});

describe("transpose", () => {
  it("round-trips a small backlinks map and maps a slug with no outbound edges to []", () => {
    // b links to a (backlinks.a lists b); nothing links to b, and a links to
    // nothing, so a's outbound edges are empty.
    const backlinks = {
      a: [{ slug: "b", count: 1 }],
      b: [],
    };

    expect(Object.fromEntries(transpose(backlinks))).toEqual({
      a: [],
      b: ["a"],
    });
  });
});
