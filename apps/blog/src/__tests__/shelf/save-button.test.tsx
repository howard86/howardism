import { afterEach, describe, expect, it, mock } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: () => undefined,
    replace: () => undefined,
    back: () => undefined,
    prefetch: () => undefined,
  }),
}));

import { ShelfTabs } from "@/app/(blog)/shelf/shelf-tabs";
import { SaveButton } from "@/components/save-button";
import { isSaved } from "@/lib/reading-store";
import type { ShelfManifestEntry } from "@/lib/shelf-rows";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const SAVE = /save for later/i;
const SAVED = /saved for later/i;
const ALPHA_TITLE = /Alpha Article/i;
const EMPTY_SAVED = /nothing saved yet/i;
const SAVED_TAB = /^saved/i;
const SIXTY_PCT = /60%/;

const manifest: ShelfManifestEntry[] = [
  {
    slug: "alpha",
    title: "Alpha Article",
    label: "AI Engineering",
    href: "/articles/alpha",
    archived: false,
    kindPrefix: "C",
    readingTime: 8,
    tags: [],
  },
];

function seedSaved(): void {
  localStorage.setItem(
    "howardism:reading-saved",
    JSON.stringify([{ slug: "alpha", savedAt: Date.now() }])
  );
}

/** Radix tabs activate on focus, not click. */
async function openSavedTab(): Promise<void> {
  fireEvent.focusIn(await screen.findByRole("tab", { name: SAVED_TAB }));
}

describe("SaveButton", () => {
  it("toggles saved state on click and persists it", async () => {
    render(<SaveButton slug="alpha" />);

    const button = screen.getByRole("button", { name: SAVE });
    expect(button.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(button);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: SAVED }).getAttribute("aria-pressed")
      ).toBe("true")
    );
    expect(isSaved("alpha")).toBe(true);
  });

  it("reflects an already-saved article on mount", async () => {
    seedSaved();
    render(<SaveButton slug="alpha" />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: SAVED })).not.toBeNull()
    );
  });
});

describe("ShelfTabs saved tab", () => {
  it("lists saved articles and drops a row when unsaved", async () => {
    seedSaved();
    render(<ShelfTabs manifest={manifest} />);
    await openSavedTab();

    const link = await waitFor(() =>
      screen.getByRole("link", { name: ALPHA_TITLE })
    );
    expect(link.getAttribute("href")).toBe("/articles/alpha");

    fireEvent.click(screen.getByRole("button", { name: SAVED }));
    await waitFor(() => expect(screen.queryByText(ALPHA_TITLE)).toBeNull());
  });

  it("shows the empty state when nothing is saved but something was read", async () => {
    // The tabs only render once the shelf holds something; a wholly empty
    // shelf shows the invitation instead, so seed a read to reach this state.
    localStorage.setItem(
      "howardism:reading-history",
      JSON.stringify([
        { slug: "alpha", pct: 0.6, lastReadAt: Date.now(), firstReadAt: 1 },
      ])
    );
    render(<ShelfTabs manifest={manifest} />);
    await openSavedTab();
    await waitFor(() => expect(screen.getByText(EMPTY_SAVED)).not.toBeNull());
  });

  it("carries reading progress onto a saved row that was also read", async () => {
    seedSaved();
    localStorage.setItem(
      "howardism:reading-history",
      JSON.stringify([{ slug: "alpha", pct: 0.6, lastReadAt: Date.now() }])
    );
    render(<ShelfTabs manifest={manifest} />);
    await openSavedTab();

    await screen.findByRole("link", { name: ALPHA_TITLE });
    expect(screen.getAllByText(SIXTY_PCT).length).toBeGreaterThan(0);
  });
});
