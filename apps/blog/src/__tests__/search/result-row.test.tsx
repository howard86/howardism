import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import { ResultRow } from "@/components/search/result-row";
import type { SearchEntry } from "@/components/search/search-data";

const entry: SearchEntry = {
  slug: "agent-loop-pattern",
  title: "Agent Loop Pattern",
  description: "Loops as a primitive.",
  tag: "Concept",
  domain: "agent-systems",
  tags: ["automation"],
  body: "A loop executes a prompt until done.",
};

afterEach(cleanup);

describe("ResultRow", () => {
  it("renders title, kind badge, domain label, and a highlighted snippet", () => {
    render(<ResultRow entry={entry} query="loop" />);
    expect(screen.getByText("Agent Loop Pattern")).toBeDefined();
    expect(screen.getByText("C")).toBeDefined();
    expect(screen.getByText("Agent Systems")).toBeDefined();
    expect(document.querySelector("mark")?.textContent).toBe("loop");
  });

  it("falls back to the description when the match is not in the body", () => {
    render(<ResultRow entry={entry} query="agent" />);
    expect(document.querySelector("mark")).toBeNull();
    expect(screen.getByText("Loops as a primitive.")).toBeDefined();
  });
});
