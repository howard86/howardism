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
        body: "A loop repeatedly executes a prompt until done.",
      },
      {
        slug: "rlhf",
        title: "RLHF",
        description: "Human feedback.",
        tag: "Concept",
        domain: "model-capability-and-training",
        tags: ["alignment"],
        body: "Reward models shape behaviour.",
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
      expect(screen.getByText("Type to search articles.")).toBeDefined()
    );
  });

  it("filters to matching articles as the user types", async () => {
    render(<SearchPalette onOpenChange={() => undefined} open />);
    const input = await screen.findByPlaceholderText("Search articles…");
    fireEvent.change(input, { target: { value: "loop" } });

    await waitFor(() =>
      expect(screen.getByText("Agent Loop Pattern")).toBeDefined()
    );
    expect(screen.queryByText("RLHF")).toBeNull();
    expect(document.querySelector("mark")?.textContent).toBe("loop");
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
