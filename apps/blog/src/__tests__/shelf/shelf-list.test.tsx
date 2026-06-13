import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

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
  },
];

const ROW_TITLE = /Alpha Article/i;
const EMPTY_STATE = /nothing on your shelf yet/i;

describe("ShelfList", () => {
  it("renders a history row linking to the top of the article", async () => {
    localStorage.setItem(
      "howardism:reading-history",
      JSON.stringify([{ slug: "alpha", pct: 0.6, lastReadAt: Date.now() }])
    );

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
});
