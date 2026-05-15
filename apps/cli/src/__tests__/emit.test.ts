import { describe, expect, it } from "bun:test";

import { buildArticleSource } from "../import-wiki/emit.ts";

describe("buildArticleSource — topic frontmatter", () => {
  it("emits a topic line, slotted between tag and readingTime, when set", () => {
    const out = buildArticleSource({
      imageFile: "agent-loops.png",
      imageAlt: "Illustration for Agent Loops",
      meta: {
        date: "2026-05-01",
        title: "Agent Loops",
        description: "A note.",
        readingTime: 2,
        tag: "Concept",
        topic: "harness",
      },
      body: "Body.",
    });

    expect(out).toContain("tag: Concept\ntopic: harness\nreadingTime: 2");
  });

  it("omits the topic line entirely when topic is undefined", () => {
    const out = buildArticleSource({
      imageFile: "x.png",
      imageAlt: "alt",
      meta: {
        date: "2026-05-01",
        title: "X",
        description: "d",
        readingTime: 1,
        tag: "Essay",
      },
      body: "Body.",
    });

    expect(out).not.toContain("topic:");
  });

  it("preserves the existing sources block when topic is also set", () => {
    const out = buildArticleSource({
      imageFile: "x.png",
      imageAlt: "alt",
      meta: {
        date: "2026-05-01",
        title: "X",
        description: "d",
        readingTime: 1,
        tag: "Concept",
        topic: "alignment",
        sources: [{ title: "Source A", url: "https://example.com/a" }],
      },
      body: "Body.",
    });

    expect(out).toContain("topic: alignment");
    expect(out).toContain("sources:");
    expect(out).toContain("Source A");
  });
});
