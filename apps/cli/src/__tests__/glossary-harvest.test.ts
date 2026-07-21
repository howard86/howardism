import { describe, expect, it } from "bun:test";

import {
  extractBody,
  extractCandidates,
  filterAgainstGlossary,
} from "../glossary/harvest.ts";

const doc = (slug: string, text: string) => [{ slug, text }];

const termsOf = (candidates: ReturnType<typeof extractCandidates>): string[] =>
  candidates.map((c) => c.term);

describe("extractCandidates", () => {
  it("extracts an acronym as tech", () => {
    const candidates = extractCandidates(
      doc("a", "The system uses RLHF to align outputs.")
    );
    const rlhf = candidates.find((c) => c.term === "RLHF");
    expect(rlhf?.category).toBe("tech");
  });

  it("extracts a CamelCase / mixed-case token as product", () => {
    const candidates = extractCandidates(
      doc("a", "DeepMind published the paper on TypeScript tooling.")
    );
    expect(termsOf(candidates)).toContain("DeepMind");
    expect(termsOf(candidates)).toContain("TypeScript");
    const deepmind = candidates.find((c) => c.term === "DeepMind");
    expect(deepmind?.category).toBe("product");
  });

  it("extracts a multi-word Capitalized phrase as entity, without also emitting its component words", () => {
    const candidates = extractCandidates(
      doc(
        "a",
        "Anthropic pioneered Constitutional AI as a technique for training models."
      )
    );
    expect(termsOf(candidates)).toContain("Constitutional AI");
    // "AI" alone must not also surface as a separate acronym candidate — its
    // span was already claimed by the phrase match.
    expect(termsOf(candidates)).not.toContain("AI");
  });

  it("does not extract a single repeated Capitalized word (no mid-sentence-repeat rule)", () => {
    const candidates = extractCandidates(
      doc(
        "a",
        "The team praised Hermes for its speed. Later, they upgraded Hermes again. Colleagues still trust Hermes today."
      )
    );
    expect(termsOf(candidates)).not.toContain("Hermes");
  });

  it("rejects an RFC-2119 keyword as an acronym", () => {
    const candidates = extractCandidates(
      doc("a", "Deployments MUST rotate credentials regularly.")
    );
    expect(termsOf(candidates)).not.toContain("MUST");
  });

  it("rejects a phrase containing an RFC-2119 keyword", () => {
    const candidates = extractCandidates(
      doc("a", "Deployments MUST enforce the policy.")
    );
    expect(termsOf(candidates)).not.toContain("Deployments MUST");
  });

  it("rejects a phrase that opens on an auxiliary verb", () => {
    const candidates = extractCandidates(
      doc("a", "Is GRPO the right choice for this workload?")
    );
    expect(termsOf(candidates)).not.toContain("Is GRPO");
  });

  it("ignores fenced code blocks and the heroImage export line", () => {
    const raw = [
      "---",
      "title: Test",
      "---",
      'export { default as heroImage } from "../assets/test.png";',
      "",
      "Before text mentions RLHF once.",
      "",
      "```ts",
      "const ZZZFAKE = 'GPT-9';",
      "```",
      "",
      "After text.",
    ].join("\n");
    const cleaned = extractBody(raw);
    expect(cleaned).not.toContain("ZZZFAKE");
    expect(cleaned).not.toContain("heroImage");
    const candidates = extractCandidates(doc("a", cleaned));
    expect(termsOf(candidates)).not.toContain("ZZZFAKE");
    expect(termsOf(candidates)).not.toContain("GPT-9");
    expect(termsOf(candidates)).toContain("RLHF");
  });

  it("strips whole heading lines so Title Case heading text can't form a fake phrase", () => {
    const raw = [
      "---",
      "title: Test",
      "---",
      "",
      "## Models Improve Over Time",
      "",
      "The article mentions Deep Modules as a real concept in its prose.",
    ].join("\n");
    const cleaned = extractBody(raw);
    expect(cleaned).not.toContain("Models Improve");
    const candidates = extractCandidates(doc("a", cleaned));
    expect(termsOf(candidates)).not.toContain("Models Improve Over Time");
    expect(termsOf(candidates)).toContain("Deep Modules");
  });
});

describe("filterAgainstGlossary", () => {
  it("drops exact (case-insensitive) matches", () => {
    const candidates = extractCandidates(
      doc("a", "The system uses RLHF to align outputs.")
    );
    const filtered = filterAgainstGlossary(candidates, [
      { term: "rlhf", category: "tech" },
    ]);
    expect(termsOf(filtered)).not.toContain("RLHF");
  });

  it("drops a candidate that is a substring of an existing longer entry", () => {
    const candidates = [{ term: "Cherny", category: "entity", slugs: ["a"] }];
    const filtered = filterAgainstGlossary(candidates, [
      { term: "Boris Cherny", category: "entity" },
    ]);
    expect(filtered).toEqual([]);
  });

  it("keeps a candidate that only shares a substring, not a word-bounded one", () => {
    const candidates = [{ term: "Cherny", category: "entity", slugs: ["a"] }];
    const filtered = filterAgainstGlossary(candidates, [
      { term: "Chernyakova", category: "entity" },
    ]);
    expect(filtered).toEqual(candidates);
  });
});
