import { afterEach, describe, expect, it } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { ShelfList } from "@/app/(blog)/shelf/shelf-list";
import type { ShelfManifestEntry } from "@/lib/shelf-rows";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

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
  {
    slug: "gamma",
    title: "Gamma Article",
    label: "Entities",
    href: "/articles/gamma",
    archived: true,
    kindPrefix: "C",
    readingTime: 8,
    tags: [],
  },
];

const HISTORY_KEY = "howardism:reading-history";
const ROW_TITLE = /Alpha Article/i;
const ARCHIVED_TITLE = /Gamma Article/i;
const EMPTY_STATE = /nothing on your shelf yet/i;
const ARCHIVED_TAG = /archived/i;
const TOMBSTONE = /no longer available/i;
const REMOVE_ALPHA = /remove alpha article from shelf/i;
const DISMISS_GHOST = /dismiss ghost-slug/i;

function seedHistory(entries: { slug: string; pct: number }[]): void {
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(
      entries.map((entry) => ({ ...entry, lastReadAt: Date.now() }))
    )
  );
}

describe("ShelfList", () => {
  it("renders a history row linking to the top of the article", async () => {
    seedHistory([{ slug: "alpha", pct: 0.6 }]);
    render(<ShelfList manifest={manifest} />);

    const link = await waitFor(() =>
      screen.getByRole("link", { name: ROW_TITLE })
    );
    expect(link.getAttribute("href")).toBe("/articles/alpha");
  });

  it("shows the empty state when there is no reading history", async () => {
    render(<ShelfList manifest={manifest} />);

    await waitFor(() => expect(screen.getByText(EMPTY_STATE)).not.toBeNull());
  });

  it("removes a row when its remove control is clicked", async () => {
    seedHistory([{ slug: "alpha", pct: 0.6 }]);
    render(<ShelfList manifest={manifest} />);

    const remove = await waitFor(() =>
      screen.getByRole("button", { name: REMOVE_ALPHA })
    );
    fireEvent.click(remove);

    await waitFor(() => expect(screen.queryByText(ROW_TITLE)).toBeNull());
    expect(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")).toEqual([]);
  });

  it("tags an archived read and still links it", async () => {
    seedHistory([{ slug: "gamma", pct: 0.5 }]);
    render(<ShelfList manifest={manifest} />);

    await waitFor(() => expect(screen.getByText(ARCHIVED_TAG)).not.toBeNull());
    expect(
      screen.getByRole("link", { name: ARCHIVED_TITLE }).getAttribute("href")
    ).toBe("/articles/gamma");
  });

  it("renders a dismissible tombstone for a slug that no longer resolves", async () => {
    seedHistory([{ slug: "ghost-slug", pct: 0.7 }]);
    render(<ShelfList manifest={manifest} />);

    await waitFor(() => expect(screen.getByText(TOMBSTONE)).not.toBeNull());
    // Not a link — there's no article to open.
    expect(screen.queryByRole("link")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: DISMISS_GHOST }));
    await waitFor(() => expect(screen.queryByText(TOMBSTONE)).toBeNull());
  });
});
