import { describe, expect, it } from "bun:test";

import {
  computeReadingTime,
  detectEntityPrefix,
  escapeMdxBody,
  firstParagraph,
  redactLocalPaths,
  rewriteWikilinks,
  stripDuplicateLeadingHeading,
} from "../import-wiki/transform.ts";

describe("rewriteWikilinks", () => {
  it("rewrites in-set slug to <Link> with frontmatter title", () => {
    const map = new Map([["claude-code", "Claude Code"]]);
    const { body, hasInternalLink } = rewriteWikilinks(
      "See [[claude-code]] for details.",
      map
    );
    expect(body).toBe(
      'See <Link href="/articles/claude-code">Claude Code</Link> for details.'
    );
    expect(hasInternalLink).toBe(true);
  });

  it("preserves an explicit |label| when present", () => {
    const map = new Map([["claude-code", "Claude Code"]]);
    const { body } = rewriteWikilinks("Try [[claude-code|Claude]] today.", map);
    expect(body).toBe(
      'Try <Link href="/articles/claude-code">Claude</Link> today.'
    );
  });

  it("renders raw/<name> as plain humanised text and flags nothing", () => {
    const map = new Map<string, string>();
    const { body, hasInternalLink, unresolved } = rewriteWikilinks(
      "Source: [[raw/Best Practices for Claude Code]].",
      map
    );
    expect(body).toBe("Source: Best Practices for Claude Code.");
    expect(hasInternalLink).toBe(false);
    expect(unresolved).toEqual([]);
  });

  it("records unresolved slugs and renders them as title-cased plain text", () => {
    const map = new Map<string, string>();
    const { body, unresolved, hasInternalLink } = rewriteWikilinks(
      "See [[missing-page]].",
      map
    );
    expect(body).toBe("See Missing Page.");
    expect(hasInternalLink).toBe(false);
    expect(unresolved).toEqual(["missing-page"]);
  });

  it("accepts the escaped pipe `\\|` from markdown-table wikilinks", () => {
    const map = new Map([
      ["codex-app-server-protocol", "Codex App Server Protocol"],
    ]);
    const { body, hasInternalLink } = rewriteWikilinks(
      "Run [[codex-app-server-protocol\\|Codex App Server]] for stdio.",
      map
    );
    expect(body).toBe(
      'Run <Link href="/articles/codex-app-server-protocol">Codex App Server</Link> for stdio.'
    );
    expect(hasInternalLink).toBe(true);
  });

  it("preserves the anchor suffix in the href", () => {
    const map = new Map([
      ["claude-code-best-practices", "Claude Code Best Practices"],
    ]);
    const { body } = rewriteWikilinks(
      "See [[claude-code-best-practices#Scaling Patterns]].",
      map
    );
    expect(body).toBe(
      'See <Link href="/articles/claude-code-best-practices#Scaling Patterns">Claude Code Best Practices</Link>.'
    );
  });

  it("resolves a capitalised wikilink to the lowercase slug", () => {
    const map = new Map([["anthropic", "Anthropic"]]);
    const { body } = rewriteWikilinks("Made by [[Anthropic]].", map);
    expect(body).toBe(
      'Made by <Link href="/articles/anthropic">Anthropic</Link>.'
    );
  });

  it("strips the wiki/<folder>/ prefix when resolving", () => {
    const map = new Map([["what-are-ai-tools", "What Are AI Tools?"]]);
    const { body, hasInternalLink } = rewriteWikilinks(
      "Refer to [[wiki/derived/what-are-ai-tools]].",
      map
    );
    expect(body).toBe(
      'Refer to <Link href="/articles/what-are-ai-tools">What Are AI Tools?</Link>.'
    );
    expect(hasInternalLink).toBe(true);
  });
});

describe("escapeMdxBody", () => {
  it("escapes braces and lone < outside code blocks", () => {
    const input = "Use {props} when x < 5.";
    expect(escapeMdxBody(input)).toBe("Use \\{props\\} when x &lt; 5.");
  });

  it("preserves content inside fenced code blocks verbatim", () => {
    const input = [
      "before {x}",
      "```ts",
      "if (x < 5) { return; }",
      "```",
      "after {y}",
    ].join("\n");
    const out = escapeMdxBody(input);
    const lines = out.split("\n");
    expect(lines[0]).toBe("before \\{x\\}");
    expect(lines[1]).toBe("```ts");
    expect(lines[2]).toBe("if (x < 5) { return; }");
    expect(lines[3]).toBe("```");
    expect(lines[4]).toBe("after \\{y\\}");
  });

  it("leaves < before a letter alone (it might be valid JSX)", () => {
    const input = '<Link href="/foo">x</Link>';
    expect(escapeMdxBody(input)).toBe(input);
  });

  it("preserves inline code spans", () => {
    const input = "Set the `{x}` placeholder and check `a < b`.";
    expect(escapeMdxBody(input)).toBe(input);
  });
});

describe("stripDuplicateLeadingHeading", () => {
  it("removes a leading H1 that matches the title", () => {
    const body = "# Claude Code\n\nBody starts here.";
    expect(stripDuplicateLeadingHeading(body, "Claude Code")).toBe(
      "Body starts here."
    );
  });

  it("leaves the H1 alone when it does not match", () => {
    const body = "# Different Title\n\nBody.";
    expect(stripDuplicateLeadingHeading(body, "Claude Code")).toBe(
      "# Different Title\n\nBody."
    );
  });

  it("leaves bodies without a leading H1 alone", () => {
    const body = "Body starts here.";
    expect(stripDuplicateLeadingHeading(body, "Claude Code")).toBe(
      "Body starts here."
    );
  });
});

describe("computeReadingTime", () => {
  it("returns 1 for very short bodies", () => {
    expect(computeReadingTime("hello world")).toBe(1);
  });

  it("rounds up to the next minute at 200 wpm", () => {
    const words = Array.from({ length: 250 }, () => "word").join(" ");
    expect(computeReadingTime(words)).toBe(2);
  });

  it("handles empty input", () => {
    expect(computeReadingTime("")).toBe(1);
  });
});

describe("redactLocalPaths", () => {
  it("strips the obsidian-vault root, with or without backticks", () => {
    expect(
      redactLocalPaths("Regenerated from `obsidian-vault/Howardism/wiki/`.")
    ).toBe("Regenerated.");
    expect(
      redactLocalPaths("See obsidian-vault/Howardism/wiki/ for details.")
    ).toBe("See for details.");
  });

  it("drops `raw/assets/<file>` references and cleans the surrounding prose", () => {
    expect(
      redactLocalPaths(
        "Local PDF saved at `raw/assets/model-spec.pdf` for appendix lookups."
      )
    ).toBe("Local PDF saved for appendix lookups.");
  });

  it("rewrites well-known vault directories and files to neutral nouns", () => {
    expect(redactLocalPaths("Filed in `wiki/derived/`.")).toBe(
      "Filed in derived."
    );
    expect(redactLocalPaths("See `wiki/index.md` for the catalog.")).toBe(
      "See the index for the catalog."
    );
    expect(
      redactLocalPaths("Bumped wiki/index.md and added wiki/log.md entries.")
    ).toBe("Bumped the index and added the log entries.");
  });

  it("leaves prose without vault paths unchanged", () => {
    const input = "Plain prose with no vault references at all.";
    expect(redactLocalPaths(input)).toBe(input);
  });
});

describe("detectEntityPrefix", () => {
  it("strips a leading underscore-style `_Entity._` marker and flags it", () => {
    const result = detectEntityPrefix(
      "_Entity._ Anthropic's agentic coding product."
    );
    expect(result.isEntity).toBe(true);
    expect(result.description).toBe("Anthropic's agentic coding product.");
  });

  it("strips a leading asterisk-style `*Entity.*` marker and flags it", () => {
    const result = detectEntityPrefix(
      "*Entity.* Anthropic's agentic coding product."
    );
    expect(result.isEntity).toBe(true);
    expect(result.description).toBe("Anthropic's agentic coding product.");
  });

  it("collapses any trailing whitespace after the marker", () => {
    const result = detectEntityPrefix("_Entity._   spaced out description.");
    expect(result.isEntity).toBe(true);
    expect(result.description).toBe("spaced out description.");
  });

  it("returns the input unchanged when no marker is present", () => {
    const input = "A regular concept description.";
    const result = detectEntityPrefix(input);
    expect(result.isEntity).toBe(false);
    expect(result.description).toBe(input);
  });

  it("only treats the marker as a prefix, not mid-string occurrences", () => {
    const input = "An aside _Entity._ in the middle.";
    const result = detectEntityPrefix(input);
    expect(result.isEntity).toBe(false);
    expect(result.description).toBe(input);
  });

  it("does not mistake non-Entity emphasis for the marker", () => {
    const result = detectEntityPrefix("_Concept._ A regular concept.");
    expect(result.isEntity).toBe(false);
    expect(result.description).toBe("_Concept._ A regular concept.");
  });
});

describe("firstParagraph", () => {
  it("skips headings and yields the first prose paragraph", () => {
    const body =
      "## Summary\n\nClaude Code is a coding agent. It runs in your terminal.\n\nMore content here.";
    expect(firstParagraph(body)).toBe(
      "Claude Code is a coding agent. It runs in your terminal."
    );
  });

  it("skips fenced code blocks at the top", () => {
    const body = "```ts\ncode\n```\n\nThe real first paragraph.";
    expect(firstParagraph(body)).toBe("The real first paragraph.");
  });

  it("truncates at a word boundary when too long", () => {
    const longWord = "characters ".repeat(40);
    const result = firstParagraph(longWord);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(201);
  });
});
