import { describe, expect, it } from "bun:test";

import { parseMocConcepts } from "../generate-quiz/parse-moc.ts";
import { buildQuizPrompt } from "../generate-quiz/prompt.ts";

const MOC = `> Map of Content for the ai-engineering domain.

- [Agent Loop Pattern](/articles/agent-loop-pattern) — loops as a primitive
- [Zero Trust for AI Agents](/articles/zero-trust-for-ai-agents) *(hub)* — security framework
- [AI-Accelerated Offense](/articles/ai-accelerated-offense) *(hub)* — exploit timeline
- [Self Link](/articles/moc-ai-engineering) — should be skipped
- [Agent Loop Pattern](/articles/agent-loop-pattern) — duplicate, skipped
not a concept line
`;

describe("parseMocConcepts", () => {
  const concepts = parseMocConcepts(MOC);

  it("extracts member concepts in order", () => {
    expect(concepts.map((c) => c.slug)).toEqual([
      "agent-loop-pattern",
      "zero-trust-for-ai-agents",
      "ai-accelerated-offense",
    ]);
  });

  it("flags hub concepts via the *(hub)* marker", () => {
    expect(
      concepts.find((c) => c.slug === "zero-trust-for-ai-agents")?.isHub
    ).toBe(true);
    expect(concepts.find((c) => c.slug === "agent-loop-pattern")?.isHub).toBe(
      false
    );
  });

  it("skips MOC self-links and duplicates", () => {
    expect(
      concepts.filter((c) => c.slug === "agent-loop-pattern")
    ).toHaveLength(1);
    expect(concepts.some((c) => c.slug.startsWith("moc-"))).toBe(false);
  });
});

describe("buildQuizPrompt", () => {
  it("embeds the title, output path, and article body", () => {
    const prompt = buildQuizPrompt({
      title: "Agent Loop Pattern",
      articleBody: "A loop repeatedly executes a prompt.",
      outputPath: "/tmp/agent-loop-pattern.json",
      mcqCount: 3,
      cardCount: 2,
    });
    expect(prompt).toContain("Agent Loop Pattern");
    expect(prompt).toContain("/tmp/agent-loop-pattern.json");
    expect(prompt).toContain("A loop repeatedly executes a prompt.");
    expect(prompt).toContain("exactly 4 options");
  });
});
