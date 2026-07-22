import { afterEach, describe, expect, it, mock } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const pushed: string[] = [];

mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: (href: string) => pushed.push(href),
    replace: () => undefined,
    back: () => undefined,
    prefetch: () => undefined,
  }),
}));

import { ShelfTabs } from "@/app/(blog)/shelf/shelf-tabs";
import type { ShelfManifestEntry } from "@/lib/shelf-rows";

const COMPARE_BUTTON = /compare \(\d+\)/i;
const ALPHA_LINK = /Alpha/i;
const ONE_SELECTED = /1 selected/;
const TWO_SELECTED = /2 selected/;
const THREE_SELECTED = /3 selected/;
const SAVED_TAB = /^saved/i;
const HISTORY_TAB = /^history/i;

const manifest: ShelfManifestEntry[] = ["a", "b", "c", "d", "e"].map(
  (slug, index) => ({
    slug,
    title: ["Alpha", "Beta", "Gamma", "Delta", "Echo"][index] ?? slug,
    label: "AI",
    href: `/articles/${slug}`,
    archived: false,
    kindPrefix: "C",
    readingTime: 8,
    tags: [],
  })
);

function seedHistory(slugs: string[]): void {
  localStorage.setItem(
    "howardism:reading-history",
    JSON.stringify(
      slugs.map((slug, index) => ({
        slug,
        pct: 0.5,
        lastReadAt: 1000 - index,
        firstReadAt: 1000 - index,
      }))
    )
  );
}

function seedSaved(slugs: string[]): void {
  localStorage.setItem(
    "howardism:reading-saved",
    JSON.stringify(
      slugs.map((slug, index) => ({ slug, savedAt: 1000 - index }))
    )
  );
}

const checkbox = (title: string) =>
  screen.getByRole("checkbox", { name: `Select ${title} to compare` });

/** Enter compare mode via the controls-bar toggle (off by default). */
async function enterCompareMode(): Promise<void> {
  fireEvent.click(await screen.findByRole("button", { name: "Select" }));
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  pushed.length = 0;
});

describe("Shelf compare selection", () => {
  it("only shows checkboxes while compare mode is on, clearing on exit", async () => {
    seedHistory(["a"]);
    render(<ShelfTabs manifest={manifest} />);

    await screen.findByRole("link", { name: ALPHA_LINK });
    expect(screen.queryByRole("checkbox")).toBeNull();

    await enterCompareMode();
    fireEvent.click(checkbox("Alpha"));
    expect(screen.getByText(ONE_SELECTED)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText(ONE_SELECTED)).toBeNull();
  });

  it("keeps a selection across switching between History and Saved tabs", async () => {
    seedHistory(["a"]);
    seedSaved(["e"]);
    render(<ShelfTabs manifest={manifest} />);
    await enterCompareMode();

    fireEvent.click(
      await screen.findByRole("checkbox", { name: "Select Alpha to compare" })
    );
    expect(screen.getByText(ONE_SELECTED)).not.toBeNull();

    // Radix tabs activate on focus, not click.
    fireEvent.focusIn(screen.getByRole("tab", { name: SAVED_TAB }));
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "Select Echo to compare" })
    );
    expect(screen.getByText(TWO_SELECTED)).not.toBeNull();

    fireEvent.focusIn(screen.getByRole("tab", { name: HISTORY_TAB }));
    await waitFor(() =>
      expect((checkbox("Alpha") as HTMLInputElement).checked).toBe(true)
    );
  });

  it("caps the selection at three and prevents a fourth", async () => {
    seedHistory(["a", "b", "c", "d"]);
    render(<ShelfTabs manifest={manifest} />);
    await enterCompareMode();

    fireEvent.click(
      await screen.findByRole("checkbox", { name: "Select Alpha to compare" })
    );
    fireEvent.click(checkbox("Beta"));
    fireEvent.click(checkbox("Gamma"));
    expect(screen.getByText(THREE_SELECTED)).not.toBeNull();

    const fourth = checkbox("Delta") as HTMLInputElement;
    expect(fourth.disabled).toBe(true);
    fireEvent.click(fourth);
    expect(screen.getByText(THREE_SELECTED)).not.toBeNull();
  });

  it("navigates to the compare route built from the selection", async () => {
    seedHistory(["a", "b"]);
    render(<ShelfTabs manifest={manifest} />);
    await enterCompareMode();

    fireEvent.click(
      await screen.findByRole("checkbox", { name: "Select Alpha to compare" })
    );
    fireEvent.click(checkbox("Beta"));
    fireEvent.click(screen.getByRole("button", { name: COMPARE_BUTTON }));

    expect(pushed).toEqual(["/compare?ids=a,b"]);
  });
});
