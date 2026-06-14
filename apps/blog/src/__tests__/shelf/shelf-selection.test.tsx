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

const manifest: ShelfManifestEntry[] = [
  {
    slug: "a",
    title: "Alpha",
    label: "AI",
    href: "/articles/a",
    archived: false,
  },
  {
    slug: "b",
    title: "Beta",
    label: "AI",
    href: "/articles/b",
    archived: false,
  },
  {
    slug: "c",
    title: "Gamma",
    label: "AI",
    href: "/articles/c",
    archived: false,
  },
  {
    slug: "d",
    title: "Delta",
    label: "AI",
    href: "/articles/d",
    archived: false,
  },
  {
    slug: "e",
    title: "Echo",
    label: "AI",
    href: "/articles/e",
    archived: false,
  },
];

function seedHistory(slugs: string[]): void {
  localStorage.setItem(
    "howardism:reading-history",
    JSON.stringify(
      slugs.map((slug, index) => ({ slug, pct: 0.5, lastReadAt: 1000 - index }))
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

afterEach(() => {
  cleanup();
  localStorage.clear();
  pushed.length = 0;
});

describe("Shelf compare selection", () => {
  it("keeps a selection across switching between History and Saved tabs", async () => {
    seedHistory(["a"]);
    seedSaved(["e"]);
    render(<ShelfTabs manifest={manifest} />);

    fireEvent.click(
      await screen.findByRole("checkbox", { name: "Select Alpha to compare" })
    );
    expect(screen.getByText("1 selected")).not.toBeNull();

    // Radix tabs activate on focus, not click.
    fireEvent.focusIn(screen.getByRole("tab", { name: "Saved" }));
    fireEvent.click(
      await screen.findByRole("checkbox", { name: "Select Echo to compare" })
    );
    expect(screen.getByText("2 selected")).not.toBeNull();

    fireEvent.focusIn(screen.getByRole("tab", { name: "History" }));
    await waitFor(() =>
      expect((checkbox("Alpha") as HTMLInputElement).checked).toBe(true)
    );
  });

  it("caps the selection at three and prevents a fourth", async () => {
    seedHistory(["a", "b", "c", "d"]);
    render(<ShelfTabs manifest={manifest} />);

    fireEvent.click(
      await screen.findByRole("checkbox", { name: "Select Alpha to compare" })
    );
    fireEvent.click(checkbox("Beta"));
    fireEvent.click(checkbox("Gamma"));
    expect(screen.getByText("3 selected")).not.toBeNull();

    const fourth = checkbox("Delta") as HTMLInputElement;
    expect(fourth.disabled).toBe(true);
    fireEvent.click(fourth);
    expect(screen.getByText("3 selected")).not.toBeNull();
  });

  it("navigates to the compare route built from the selection", async () => {
    seedHistory(["a", "b"]);
    render(<ShelfTabs manifest={manifest} />);

    fireEvent.click(
      await screen.findByRole("checkbox", { name: "Select Alpha to compare" })
    );
    fireEvent.click(checkbox("Beta"));
    fireEvent.click(screen.getByRole("button", { name: COMPARE_BUTTON }));

    expect(pushed).toEqual(["/compare?ids=a,b"]);
  });
});
