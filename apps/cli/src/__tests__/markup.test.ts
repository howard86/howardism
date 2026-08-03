import { describe, expect, it } from "bun:test";

import {
  type InlineSegment,
  parseInline,
  segmentsToText,
  titleFromSlug,
} from "@howardism/article-contract/markup";

const kinds = (segments: InlineSegment[]) => segments.map((s) => s.kind);

describe("parseInline", () => {
  it("leaves unmarked prose as a single text segment", () => {
    expect(parseInline("A plain question?")).toEqual([
      { kind: "text", text: "A plain question?" },
    ]);
  });

  it("reads emphasis, code spans, and links", () => {
    const segments = parseInline(
      "Do gains persist when **normalized for PR size**, or is `churn` the *real* signal? See [the paper](https://example.com/p)."
    );
    expect(kinds(segments)).toEqual([
      "text",
      "strong",
      "text",
      "code",
      "text",
      "em",
      "text",
      "link",
      "text",
    ]);
    expect(segmentsToText(segments)).toBe(
      "Do gains persist when normalized for PR size, or is churn the real signal? See the paper."
    );
  });

  it("does not read a bold run as an empty italic", () => {
    expect(parseInline("**bold**")).toEqual([
      { kind: "strong", children: [{ kind: "text", text: "bold" }] },
    ]);
  });

  it("keeps an internal link's href so the blog can route it", () => {
    const segments = parseInline("Unlike [Prompt Injection](/articles/pi).");
    expect(kinds(segments)).toEqual(["text", "link", "text"]);
    expect(segments[1]).toEqual({
      kind: "link",
      href: "/articles/pi",
      children: [{ kind: "text", text: "Prompt Injection" }],
    });
  });

  // Emphasis nests in the vault's prose. A flat parser swallows whatever sits
  // inside a run, which is how `[[slug]]` and backticks used to reach the page
  // as raw characters.
  it("parses markup nested inside an emphasis run", () => {
    const segments = parseInline(
      "**Which instrument for the *frontier* set?**"
    );
    expect(kinds(segments)).toEqual(["strong"]);
    expect(segmentsToText(segments)).toBe(
      "Which instrument for the frontier set?"
    );
    const strong = segments[0];
    expect(strong.kind === "strong" && kinds(strong.children)).toEqual([
      "text",
      "em",
      "text",
    ]);
  });

  it("resolves a wikilink written inside an italic aside", () => {
    const segments = parseInline(
      "Answered. *(Partly informed: [[emergent]].)*"
    );
    expect(segmentsToText(segments)).toBe(
      "Answered. (Partly informed: Emergent.)"
    );
  });

  it("does not re-parse the inside of a code span", () => {
    expect(parseInline("`a *b* c`")).toEqual([
      { kind: "code", text: "a *b* c" },
    ]);
  });

  // The committed manifest predates the importer resolving its wikilinks, so
  // the parser has to render a raw one readably — as text, never as a link.
  it("renders an unresolved wikilink as its title, not as brackets", () => {
    const segments = parseInline("Unlike [[out-of-band-prompt-injection]] it…");
    expect(kinds(segments)).toEqual(["text"]);
    expect(segmentsToText(segments)).toBe(
      "Unlike Out Of Band Prompt Injection it…"
    );
  });

  it("prefers a wikilink's alias, and humanises a raw target", () => {
    expect(segmentsToText(parseInline("[[some-slug|the alias]]"))).toBe(
      "the alias"
    );
    expect(segmentsToText(parseInline("[[raw/some_paper.pdf]]"))).toBe(
      "some paper pdf"
    );
  });

  it("drops a wikilink's folder path and anchor", () => {
    expect(
      segmentsToText(parseInline("[[wiki/concepts/eval-drift#why]]"))
    ).toBe("Eval Drift");
  });

  it("leaves a lone asterisk alone", () => {
    expect(parseInline("3 * 4 is 12")).toEqual([
      { kind: "text", text: "3 * 4 is 12" },
    ]);
  });
});

describe("titleFromSlug", () => {
  it("title-cases a hyphenated slug", () => {
    expect(titleFromSlug("agent-loop-pattern")).toBe("Agent Loop Pattern");
  });
});
