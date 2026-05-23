import { describe, expect, it } from "bun:test";

import {
  extractInternalSlugs,
  extractRawSlugs,
  humanize,
  rewriteToMarkdown,
  stripToText,
  titleFromSlug,
  tokenizeWikilinks,
  type WikiToken,
} from "../import-wiki/wikilink.ts";

describe("tokenizeWikilinks", () => {
  it("parses a bare internal link", () => {
    const tokens = tokenizeWikilinks("See [[claude-code]].");
    expect(tokens).toEqual([
      {
        label: null,
        target: { kind: "internal", slug: "claude-code", anchor: null },
      },
    ]);
  });

  it("captures a label after |", () => {
    const tokens = tokenizeWikilinks("[[claude-code|Claude]]");
    expect(tokens).toEqual([
      {
        label: "Claude",
        target: { kind: "internal", slug: "claude-code", anchor: null },
      },
    ]);
  });

  it("captures a label after escaped \\|", () => {
    const tokens = tokenizeWikilinks("[[codex-app-server-protocol\\|Codex]]");
    expect(tokens).toEqual([
      {
        label: "Codex",
        target: {
          kind: "internal",
          slug: "codex-app-server-protocol",
          anchor: null,
        },
      },
    ]);
  });

  it("classifies raw/ targets", () => {
    const tokens = tokenizeWikilinks("[[raw/Best Practices for Claude]]");
    expect(tokens).toEqual([
      {
        label: null,
        target: { kind: "raw", rawSlug: "Best Practices for Claude" },
      },
    ]);
  });

  it("splits anchor from internal target", () => {
    const tokens = tokenizeWikilinks("[[claude-code#Section One]]");
    expect(tokens).toEqual([
      {
        label: null,
        target: {
          kind: "internal",
          slug: "claude-code",
          anchor: "Section One",
        },
      },
    ]);
  });

  it("strips wiki/<folder>/ prefix", () => {
    const tokens = tokenizeWikilinks("[[wiki/derived/what-are-ai-tools]]");
    expect(tokens).toEqual([
      {
        label: null,
        target: { kind: "internal", slug: "what-are-ai-tools", anchor: null },
      },
    ]);
  });

  it("preserves raw sub-paths", () => {
    const tokens = tokenizeWikilinks(
      "[[raw/Claude Mythos Preview / red.anthropic.com]]"
    );
    expect(tokens).toEqual([
      {
        label: null,
        target: {
          kind: "raw",
          rawSlug: "Claude Mythos Preview / red.anthropic.com",
        },
      },
    ]);
  });

  it("returns multiple tokens in source order", () => {
    const tokens = tokenizeWikilinks("[[a]] and [[raw/b]] and [[c#x]]");
    expect(tokens).toHaveLength(3);
    expect(tokens[0].target).toEqual({
      kind: "internal",
      slug: "a",
      anchor: null,
    });
    expect(tokens[1].target).toEqual({ kind: "raw", rawSlug: "b" });
    expect(tokens[2].target).toEqual({
      kind: "internal",
      slug: "c",
      anchor: "x",
    });
  });
});

describe("extractInternalSlugs", () => {
  it("lowercases slugs", () => {
    expect(extractInternalSlugs("[[Anthropic]]")).toEqual(["anthropic"]);
  });

  it("strips anchors", () => {
    expect(extractInternalSlugs("[[claude-code#Section]]")).toEqual([
      "claude-code",
    ]);
  });

  it("skips raw/ targets", () => {
    expect(extractInternalSlugs("[[raw/foo]]")).toEqual([]);
  });

  it("preserves duplicates by default", () => {
    expect(extractInternalSlugs("[[a]] [[a]]")).toEqual(["a", "a"]);
  });

  it("deduplicates when dedup=true", () => {
    expect(extractInternalSlugs("[[a]] [[b]] [[a]]", { dedup: true })).toEqual([
      "a",
      "b",
    ]);
  });

  // Bug-fix regression: capitalised wikilinks must lowercase
  it("regression: [[Anthropic]] with dedup returns lowercased", () => {
    expect(extractInternalSlugs("[[Anthropic]]", { dedup: true })).toEqual([
      "anthropic",
    ]);
  });

  // Bug-fix regression: anchored wikilinks must strip anchor
  it("regression: [[claude-code#Section]] strips anchor", () => {
    expect(extractInternalSlugs("[[claude-code#Section]]")).toEqual([
      "claude-code",
    ]);
  });
});

describe("extractRawSlugs", () => {
  it("extracts raw slugs preserving case", () => {
    expect(extractRawSlugs("[[raw/Best Practices]]")).toEqual([
      "Best Practices",
    ]);
  });

  it("preserves sub-paths", () => {
    expect(
      extractRawSlugs("[[raw/Claude Mythos Preview / red.anthropic.com]]")
    ).toEqual(["Claude Mythos Preview / red.anthropic.com"]);
  });

  it("preserves duplicates by default", () => {
    expect(extractRawSlugs("[[raw/a]] [[raw/a]]")).toEqual(["a", "a"]);
  });

  it("deduplicates when dedup=true", () => {
    expect(
      extractRawSlugs("[[raw/a]] [[raw/b]] [[raw/a]]", { dedup: true })
    ).toEqual(["a", "b"]);
  });

  it("skips non-raw targets", () => {
    expect(extractRawSlugs("[[claude-code]] [[wiki/concepts/x]]")).toEqual([]);
  });
});

describe("stripToText", () => {
  it("replaces bare internal link with title-cased slug", () => {
    expect(stripToText("see [[model-spec-midtraining]]")).toBe(
      "see Model Spec Midtraining"
    );
  });

  it("uses explicit label", () => {
    expect(stripToText("[[claude-code|Claude]]")).toBe("Claude");
  });

  it("humanises raw/ targets", () => {
    expect(stripToText("[[raw/Best Practices for Claude]]")).toBe(
      "Best Practices for Claude"
    );
  });

  it("leaves text without wikilinks unchanged", () => {
    expect(stripToText("nothing here")).toBe("nothing here");
  });
});

describe("rewriteToMarkdown", () => {
  it("calls the resolver for each wikilink", () => {
    const resolve = (token: WikiToken): string => {
      if (token.target.kind === "internal") {
        return `[${token.label ?? token.target.slug}](/articles/${token.target.slug})`;
      }
      return token.label ?? token.target.rawSlug;
    };
    const { body } = rewriteToMarkdown(
      "See [[claude-code]] and [[raw/foo]].",
      resolve
    );
    expect(body).toBe("See [claude-code](/articles/claude-code) and foo.");
  });

  it("passes anchor to resolver", () => {
    const resolve = (token: WikiToken): string => {
      if (token.target.kind === "internal") {
        const anchor = token.target.anchor ? `#${token.target.anchor}` : "";
        return `[link](/articles/${token.target.slug}${anchor})`;
      }
      return "raw";
    };
    const { body } = rewriteToMarkdown("[[slug#heading]]", resolve);
    expect(body).toBe("[link](/articles/slug#heading)");
  });
});

describe("humanize", () => {
  it("replaces dots, underscores, dashes with spaces", () => {
    expect(humanize("my_file.name-here")).toBe("my file name here");
  });

  it("collapses multiple separators", () => {
    expect(humanize("a---b___c...d")).toBe("a b c d");
  });
});

describe("titleFromSlug", () => {
  it("capitalises hyphenated slugs", () => {
    expect(titleFromSlug("claude-code-best-practices")).toBe(
      "Claude Code Best Practices"
    );
  });
});
