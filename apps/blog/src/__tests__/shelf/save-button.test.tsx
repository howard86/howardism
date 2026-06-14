import { afterEach, describe, expect, it } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { SavedList } from "@/app/(blog)/shelf/saved-list";
import { ShelfList } from "@/app/(blog)/shelf/shelf-list";
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

const manifest: ShelfManifestEntry[] = [
  {
    slug: "alpha",
    title: "Alpha Article",
    label: "AI Engineering",
    href: "/articles/alpha",
    archived: false,
  },
];

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
    localStorage.setItem(
      "howardism:reading-saved",
      JSON.stringify([{ slug: "alpha", savedAt: Date.now() }])
    );
    render(<SaveButton slug="alpha" />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: SAVED })).not.toBeNull()
    );
  });
});

describe("SavedList", () => {
  it("lists saved articles and drops a row when unsaved", async () => {
    localStorage.setItem(
      "howardism:reading-saved",
      JSON.stringify([{ slug: "alpha", savedAt: Date.now() }])
    );
    render(<SavedList manifest={manifest} />);

    const link = await waitFor(() =>
      screen.getByRole("link", { name: ALPHA_TITLE })
    );
    expect(link.getAttribute("href")).toBe("/articles/alpha");

    fireEvent.click(screen.getByRole("button", { name: SAVED }));
    await waitFor(() => expect(screen.queryByText(ALPHA_TITLE)).toBeNull());
  });

  it("shows the empty state when nothing is saved", async () => {
    render(<SavedList manifest={manifest} />);
    await waitFor(() => expect(screen.getByText(EMPTY_SAVED)).not.toBeNull());
  });
});

describe("ShelfList still renders history rows", () => {
  it("renders a saved-independent history row", async () => {
    localStorage.setItem(
      "howardism:reading-history",
      JSON.stringify([{ slug: "alpha", pct: 0.6, lastReadAt: Date.now() }])
    );
    render(<ShelfList manifest={manifest} />);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: ALPHA_TITLE })).not.toBeNull()
    );
  });
});
