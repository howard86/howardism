import { describe, expect, it } from "bun:test";

import {
  MCQ_CHOICE_COUNT,
  parseQuiz,
  type QuizManifest,
} from "@howardism/article-contract/manifests/quiz";

const validManifest: QuizManifest = {
  generatedOn: "2026-06-16",
  concepts: [
    {
      slug: "zero-trust-for-ai-agents",
      title: "Zero Trust for AI Agents",
      domain: "ai-engineering",
      isHub: true,
      mcq: [
        {
          q: "What posture does Zero Trust assume?",
          choices: [
            "Assume breach",
            "Assume trust",
            "Perimeter only",
            "No auth",
          ],
          answerIdx: 0,
          explanation: "Zero Trust assumes breach and verifies everything.",
        },
      ],
      cards: [
        {
          front: "Three tenets?",
          back: "Trust nothing, verify, assume breach.",
        },
      ],
    },
  ],
};

describe("parseQuiz", () => {
  it("accepts a valid manifest", () => {
    expect(parseQuiz(validManifest)).toEqual(validManifest);
  });

  it("rejects an MCQ with the wrong number of choices", () => {
    const bad = structuredClone(validManifest);
    bad.concepts[0].mcq[0].choices = ["only", "three", "here"];
    expect(() => parseQuiz(bad)).toThrow();
  });

  it("rejects an answerIdx outside the choice range", () => {
    const bad = structuredClone(validManifest);
    bad.concepts[0].mcq[0].answerIdx = MCQ_CHOICE_COUNT;
    expect(() => parseQuiz(bad)).toThrow();
  });

  it("rejects an unknown domain", () => {
    const bad = structuredClone(validManifest) as unknown as {
      concepts: { domain: string }[];
    };
    bad.concepts[0].domain = "not-a-domain";
    expect(() => parseQuiz(bad)).toThrow();
  });
});
