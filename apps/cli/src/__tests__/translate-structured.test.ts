import { describe, expect, it } from "bun:test";

import {
  appendRetryFeedback,
  parseStructuredResult,
  STRUCTURED_MAX_SOURCE_BYTES,
  useStructuredMode,
} from "../translate/index.ts";

const SMALL_SOURCE = "---\ntitle: Foo\n---\n\nBody.\n";
const NOT_JSON_RE = /not valid JSON/;
const NOT_OBJECT_RE = /not an object/;
const NO_MDX_RE = /non-empty `mdx`/;

describe("useStructuredMode", () => {
  it("is on for codex with a source under the ceiling", () => {
    expect(useStructuredMode("codex", SMALL_SOURCE)).toBe(true);
  });

  it("includes a source sitting exactly on the ceiling", () => {
    expect(
      useStructuredMode("codex", "x".repeat(STRUCTURED_MAX_SOURCE_BYTES))
    ).toBe(true);
  });

  it("falls back for a source over the ceiling", () => {
    expect(
      useStructuredMode("codex", "x".repeat(STRUCTURED_MAX_SOURCE_BYTES + 1))
    ).toBe(false);
  });

  it("measures BYTES, not characters (CJK is 3 bytes per char)", () => {
    // Under the ceiling by character count, over it by byte count.
    const cjk = "中".repeat(STRUCTURED_MAX_SOURCE_BYTES - 1);
    expect(cjk.length).toBeLessThan(STRUCTURED_MAX_SOURCE_BYTES);
    expect(useStructuredMode("codex", cjk)).toBe(false);
  });

  it("is off for every non-codex engine", () => {
    for (const engine of ["claude", "agy", "kiro", "cursor"] as const) {
      expect(useStructuredMode(engine, SMALL_SOURCE)).toBe(false);
    }
  });
});

describe("parseStructuredResult", () => {
  it("returns the mdx and the new glossary terms", () => {
    const parsed = parseStructuredResult(
      JSON.stringify({
        mdx: "---\ntitle: 標題\n---\n\n內文。\n",
        newTerms: [{ term: "Boris Cherny", category: "person" }],
      })
    );
    expect(parsed.mdx).toContain("內文。");
    expect(parsed.newTerms).toEqual([
      { term: "Boris Cherny", category: "person" },
    ]);
  });

  it("throws a precise error on unparseable JSON", () => {
    expect(() => parseStructuredResult("not json at all")).toThrow(NOT_JSON_RE);
  });

  it("throws when the final message is not a JSON object", () => {
    expect(() => parseStructuredResult('["mdx"]')).toThrow(NOT_OBJECT_RE);
  });

  it("throws when `mdx` is missing, non-string, or empty", () => {
    expect(() =>
      parseStructuredResult(JSON.stringify({ newTerms: [] }))
    ).toThrow(NO_MDX_RE);
    expect(() => parseStructuredResult(JSON.stringify({ mdx: 42 }))).toThrow(
      NO_MDX_RE
    );
    expect(() => parseStructuredResult(JSON.stringify({ mdx: "   " }))).toThrow(
      NO_MDX_RE
    );
  });

  it("tolerates a missing or malformed newTerms list rather than failing the article", () => {
    expect(
      parseStructuredResult(JSON.stringify({ mdx: "x" })).newTerms
    ).toEqual([]);
    expect(
      parseStructuredResult(JSON.stringify({ mdx: "x", newTerms: "nope" }))
        .newTerms
    ).toEqual([]);
    expect(
      parseStructuredResult(
        JSON.stringify({
          mdx: "x",
          newTerms: [
            { term: "Good", category: "org" },
            { term: "", category: "org" },
            { term: "NoCategory" },
            null,
          ],
        })
      ).newTerms
    ).toEqual([{ term: "Good", category: "org" }]);
  });
});

describe("appendRetryFeedback", () => {
  const errors = [
    "Output dropped list items (kept 12 of 20, ratio 0.60 < 0.9)",
    "heroImage line mismatch",
  ];
  const retried = appendRetryFeedback("ORIGINAL BRIEF", errors);

  it("keeps the original brief intact", () => {
    expect(retried.startsWith("ORIGINAL BRIEF")).toBe(true);
    expect(retried).not.toBe("ORIGINAL BRIEF");
  });

  it("appends every validation error as a corrective bullet", () => {
    for (const error of errors) {
      expect(retried).toContain(`- ${error}`);
    }
  });

  it("tells the model the previous attempt was rejected", () => {
    expect(retried).toContain("PREVIOUS ATTEMPT REJECTED");
  });
});
