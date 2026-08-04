import { afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createNextNavigationMock } from "@/test-support/next-navigation-mock";

const pushed: string[] = [];

// Chip labels also appear as group headings, so match the button role by name.
const AGENT_SYSTEMS = /Agent Systems/;
const CONCEPT = /Concept/;

mock.module("next/navigation", () =>
  createNextNavigationMock({
    useRouter: () => ({
      push: (href: string) => pushed.push(href),
      replace: () => undefined,
      back: () => undefined,
      prefetch: () => undefined,
    }),
  })
);

mock.module("@/data/search-index.json", () => ({
  default: {
    generatedOn: "2026-01-01",
    entries: [
      {
        slug: "agent-loop-pattern",
        title: "Agent Loop Pattern",
        description: "Loops as a primitive.",
        tag: "Concept",
        domain: "agent-systems",
        tags: ["automation"],
        keywords: "harness orchestration",
      },
      {
        slug: "rlhf",
        title: "RLHF",
        description: "Human feedback.",
        tag: "Concept",
        domain: "model-capability-and-training",
        tags: ["alignment"],
        keywords: "safety evaluation",
      },
    ],
  },
}));

const { SearchPalette } = await import("@/components/search/search-palette");

beforeAll(() => {
  // cmdk scrolls the active item into view; happy-dom lacks the method.
  Element.prototype.scrollIntoView = () => undefined;
});

afterEach(() => {
  cleanup();
  pushed.length = 0;
});

describe("SearchPalette", () => {
  it("prompts the user once the index has loaded", async () => {
    render(<SearchPalette onOpenChange={() => undefined} open />);
    await waitFor(() =>
      expect(
        screen.getByText("Type to search, or pick a filter above.")
      ).toBeDefined()
    );
  });

  it("offers the whole taxonomy as filters before anything is typed", async () => {
    render(<SearchPalette onOpenChange={() => undefined} open />);
    // An empty search box used to be a dead end; the chips are the way in.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: AGENT_SYSTEMS })).toBeDefined()
    );
    expect(screen.getByRole("button", { name: CONCEPT })).toBeDefined();
  });

  it("browses a domain when a filter is picked with no query", async () => {
    render(<SearchPalette onOpenChange={() => undefined} open />);
    const chip = await screen.findByRole("button", { name: AGENT_SYSTEMS });
    fireEvent.click(chip);

    await waitFor(() =>
      expect(screen.getByText("Agent Loop Pattern")).toBeDefined()
    );
    // Only the scoped domain's article; the other one is filtered out.
    expect(screen.queryByText("RLHF")).toBeNull();
  });

  it("clears the filter when its chip is clicked again", async () => {
    render(<SearchPalette onOpenChange={() => undefined} open />);
    const chip = await screen.findByRole("button", { name: AGENT_SYSTEMS });
    fireEvent.click(chip);
    await waitFor(() =>
      expect(screen.getByText("Agent Loop Pattern")).toBeDefined()
    );

    fireEvent.click(screen.getByRole("button", { name: AGENT_SYSTEMS }));
    await waitFor(() =>
      expect(
        screen.getByText("Type to search, or pick a filter above.")
      ).toBeDefined()
    );
  });

  it("narrows a query's results to the picked filter", async () => {
    render(<SearchPalette onOpenChange={() => undefined} open />);
    const input = await screen.findByPlaceholderText("Search articles…");
    // A query broad enough to match both articles' kind.
    fireEvent.change(input, { target: { value: "concept" } });
    await waitFor(() => expect(screen.getByText("RLHF")).toBeDefined());

    fireEvent.click(screen.getByRole("button", { name: AGENT_SYSTEMS }));
    await waitFor(() => expect(screen.queryByText("RLHF")).toBeNull());
    expect(screen.getByText("Agent Loop Pattern")).toBeDefined();
  });

  it("filters to matching articles as the user types", async () => {
    render(<SearchPalette onOpenChange={() => undefined} open />);
    const input = await screen.findByPlaceholderText("Search articles…");
    fireEvent.change(input, { target: { value: "loop" } });

    await waitFor(() =>
      expect(screen.getByText("Agent Loop Pattern")).toBeDefined()
    );
    expect(screen.queryByText("RLHF")).toBeNull();
    // Highlighted out of the summary ("Loops as a primitive."), matched
    // case-insensitively but rendered as the summary spells it.
    expect(document.querySelector("mark")?.textContent).toBe("Loop");
  });

  it("navigates to the selected article on Enter", async () => {
    render(<SearchPalette onOpenChange={() => undefined} open />);
    const input = await screen.findByPlaceholderText("Search articles…");
    fireEvent.change(input, { target: { value: "agent loop" } });
    await waitFor(() =>
      expect(screen.getByText("Agent Loop Pattern")).toBeDefined()
    );

    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() =>
      expect(pushed).toContain("/articles/agent-loop-pattern")
    );
  });
});
