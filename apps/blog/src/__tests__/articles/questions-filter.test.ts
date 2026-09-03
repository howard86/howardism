import { describe, expect, it } from "bun:test";
import type { OpenQuestionConcept } from "@/app/(blog)/articles/service";
import {
  applyBucket,
  buildStanzas,
  filterStanzas,
} from "@/app/(blog)/questions/questions-filter";

const concepts: OpenQuestionConcept[] = [
  {
    domain: "agent-systems",
    slug: "agent-loop-pattern",
    title: "Agent Loop Pattern",
    questions: [
      { kind: "now", text: "Does the loop terminate on a partial result?" },
      { kind: "source", text: "Who first published the harness benchmark?" },
    ],
    resolved: ["Retries are capped at three."],
  },
  {
    domain: "evals-and-benchmarks",
    slug: "eval-drift",
    title: "Eval Drift",
    questions: [{ kind: "wait", text: "Will the benchmark be rerun in 2027?" }],
    resolved: [],
  },
];

describe("buildStanzas", () => {
  it("flattens each concept and caches the lowercased text", () => {
    const [loop, drift] = buildStanzas(concepts);

    expect(loop.haystack).toBe("agent loop pattern");
    expect(loop.lines).toHaveLength(3);
    expect(loop.lowers).toEqual(
      loop.lines.map((line) => line.text.toLowerCase())
    );
    expect(drift.lines.map((line) => line.bucket)).toEqual(["wait"]);
  });
});

describe("filterStanzas", () => {
  const stanzas = buildStanzas(concepts);

  it("keeps every line, as the same object, when the title matches", () => {
    const kept = filterStanzas(stanzas, ["agent"], null);

    expect(kept).toHaveLength(1);
    expect(kept[0]).toBe(stanzas[0]);
  });

  it("keeps only the lines holding every token the title does not", () => {
    const kept = filterStanzas(stanzas, ["benchmark"], null);

    expect(kept.map((stanza) => stanza.slug)).toEqual([
      "agent-loop-pattern",
      "eval-drift",
    ]);
    expect(kept[0].lines.map((line) => line.text)).toEqual([
      "Who first published the harness benchmark?",
    ]);
    expect(kept[0].lowers).toEqual(
      kept[0].lines.map((line) => line.text.toLowerCase())
    );
  });

  it("drops stanzas outside the domain, and stanzas with no line left", () => {
    expect(
      filterStanzas(stanzas, [], "evals-and-benchmarks").map((s) => s.slug)
    ).toEqual(["eval-drift"]);
    expect(filterStanzas(stanzas, ["zzzz"], null)).toEqual([]);
  });

  it("passes every stanza through untouched when there is no query", () => {
    expect(filterStanzas(stanzas, [], null)).toEqual(stanzas);
  });
});

describe("applyBucket", () => {
  const stanzas = buildStanzas(concepts);

  it("returns the scoped list itself for the null bucket", () => {
    expect(applyBucket(stanzas, null)).toBe(stanzas);
  });

  it("keeps the lines in one bucket, with their lowercased text", () => {
    const kept = applyBucket(stanzas, "resolved");

    expect(kept.map((stanza) => stanza.slug)).toEqual(["agent-loop-pattern"]);
    expect(kept[0].lines.map((line) => line.text)).toEqual([
      "Retries are capped at three.",
    ]);
    expect(kept[0].lowers).toEqual(["retries are capped at three."]);
  });
});
