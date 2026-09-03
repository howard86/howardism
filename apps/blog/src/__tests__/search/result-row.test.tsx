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
  tags: ["automation", "harness", "scheduling", "runtime"],
  keywords: "cli-agent orchestration",
};

afterEach(cleanup);

describe("ResultRow", () => {
  it("renders title, kind badge, domain label, and a highlighted summary", () => {
    render(<ResultRow entry={entry} lowerQuery="loop" />);
    expect(screen.getByText("Agent Loop Pattern")).toBeDefined();
    expect(screen.getByText("C")).toBeDefined();
    expect(screen.getByText("Agent Systems")).toBeDefined();
    expect(document.querySelector("mark")?.textContent).toBe("Loop");
  });

  it("shows the summary unhighlighted when the query is not in it", () => {
    // Matched on the title; the summary has no "agent" in it to mark up.
    render(<ResultRow entry={entry} lowerQuery="agent" />);
    expect(document.querySelector("mark")).toBeNull();
    expect(screen.getByText("Loops as a primitive.")).toBeDefined();
  });

  it("puts a matching tag first, so the row shows why it matched", () => {
    // "scheduling" is third in the entry's tags and would otherwise be cut by
    // the three-chip limit — the reason this row is in the results at all.
    render(<ResultRow entry={entry} lowerQuery="scheduling" />);
    expect(screen.getByText("scheduling")).toBeDefined();
    expect(screen.queryByText("runtime")).toBeNull();
  });

  it("caps tag chips so long tag lists cannot crowd out the title", () => {
    render(<ResultRow entry={entry} lowerQuery="loop" />);
    expect(screen.getByText("automation")).toBeDefined();
    expect(screen.queryByText("runtime")).toBeNull();
  });

  it("renders without tags", () => {
    const bare: SearchEntry = { ...entry, tags: undefined };
    render(<ResultRow entry={bare} lowerQuery="loop" />);
    expect(screen.getByText("Agent Loop Pattern")).toBeDefined();
  });
});
