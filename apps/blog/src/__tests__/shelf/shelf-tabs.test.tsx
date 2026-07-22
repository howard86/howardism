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
import type { ShelfManifestEntry } from "@/lib/shelf-rows";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const DAY_MS = 24 * 3_600_000;

const manifest: ShelfManifestEntry[] = [
  {
    slug: "alpha",
    title: "Alpha Article",
    label: "Agent Systems",
    href: "/articles/alpha",
    archived: false,
    domain: "agent-systems",
    kindPrefix: "C",
    readingTime: 8,
    tags: ["agents"],
  },
  {
    slug: "beta",
    title: "Beta Article",
    label: "Alignment & Safety",
    href: "/articles/beta",
    archived: false,
    domain: "alignment-and-safety",
    kindPrefix: "S",
    readingTime: 14,
    tags: [],
  },
  {
    slug: "gamma",
    title: "Gamma Article",
    label: "Entities",
    href: "/articles/gamma",
    archived: true,
    kindPrefix: "E",
    readingTime: 5,
    tags: [],
  },
];

const HISTORY_KEY = "howardism:reading-history";
const SAVED_KEY = "howardism:reading-saved";
const ROW_TITLE = /Alpha Article/i;
const BETA_TITLE = /Beta Article/i;
const GAMMA_TITLE = /Gamma Article/i;
const EMPTY_STATE = /fills itself as you read/i;
const TAB_EMPTY_STATE = /nothing on your shelf yet/i;
const FILTERED_EMPTY = /nothing on your shelf under/i;
const TOMBSTONE = /no longer available/i;
const ARCHIVED_TAG = /archived/i;
const REMOVE_ALPHA = /remove alpha article from shelf/i;
const DISMISS_GHOST = /dismiss ghost-slug/i;
const PROGRESS_SORT = /^progress$/i;
const BROWSE_LINK = /browse all articles/i;
const AGENT_SYSTEMS_CHIP = /agent systems/i;
const ALL_CHIP = /^all/i;

function seedHistory(
  entries: { slug: string; pct: number; ageMs?: number; firstAgeMs?: number }[]
): void {
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(
      entries.map((entry) => ({
        slug: entry.slug,
        pct: entry.pct,
        lastReadAt: Date.now() - (entry.ageMs ?? 0),
        firstReadAt: Date.now() - (entry.firstAgeMs ?? entry.ageMs ?? 0),
      }))
    )
  );
}

function seedSaved(slugs: string[]): void {
  localStorage.setItem(
    SAVED_KEY,
    JSON.stringify(
      slugs.map((slug, index) => ({ slug, savedAt: 1000 - index }))
    )
  );
}

describe("ShelfTabs history tab", () => {
  it("renders a history row linking to the top of the article", async () => {
    seedHistory([{ slug: "alpha", pct: 0.6 }]);
    render(<ShelfTabs manifest={manifest} />);

    const link = await waitFor(() =>
      screen.getByRole("link", { name: ROW_TITLE })
    );
    expect(link.getAttribute("href")).toBe("/articles/alpha");
  });

  it("offers only an invitation when nothing is read or saved", async () => {
    render(<ShelfTabs manifest={manifest} />);

    await waitFor(() => expect(screen.getByText(EMPTY_STATE)).not.toBeNull());
    expect(screen.queryByRole("button", { name: PROGRESS_SORT })).toBeNull();
    expect(screen.queryByRole("button", { name: ALL_CHIP })).toBeNull();
    expect(
      screen.getByRole("link", { name: BROWSE_LINK }).getAttribute("href")
    ).toBe("/articles");
  });

  it("keeps the per-tab empty state when the other list has entries", async () => {
    seedSaved(["alpha"]);
    render(<ShelfTabs manifest={manifest} />);

    await waitFor(() =>
      expect(screen.getByText(TAB_EMPTY_STATE)).not.toBeNull()
    );
    expect(screen.queryByText(EMPTY_STATE)).toBeNull();
  });

  it("removes a row when its remove control is clicked", async () => {
    seedHistory([{ slug: "alpha", pct: 0.6 }]);
    render(<ShelfTabs manifest={manifest} />);

    const remove = await waitFor(() =>
      screen.getByRole("button", { name: REMOVE_ALPHA })
    );
    fireEvent.click(remove);

    await waitFor(() => expect(screen.queryByText(ROW_TITLE)).toBeNull());
    expect(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")).toEqual([]);
  });

  it("tags an archived read and still links it", async () => {
    seedHistory([{ slug: "gamma", pct: 0.5 }]);
    render(<ShelfTabs manifest={manifest} />);

    await waitFor(() => expect(screen.getByText(ARCHIVED_TAG)).not.toBeNull());
    expect(
      screen.getByRole("link", { name: GAMMA_TITLE }).getAttribute("href")
    ).toBe("/articles/gamma");
  });

  it("renders a dismissible tombstone for a slug that no longer resolves", async () => {
    seedHistory([{ slug: "ghost-slug", pct: 0.7 }]);
    render(<ShelfTabs manifest={manifest} />);

    await waitFor(() => expect(screen.getByText(TOMBSTONE)).not.toBeNull());
    expect(screen.queryByRole("link")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: DISMISS_GHOST }));
    await waitFor(() => expect(screen.queryByText(TOMBSTONE)).toBeNull());
  });

  it("groups recent history under recency headers", async () => {
    seedHistory([
      { slug: "alpha", pct: 0.6 },
      { slug: "beta", pct: 0.4, ageMs: 3 * DAY_MS },
    ]);
    render(<ShelfTabs manifest={manifest} />);

    await waitFor(() => expect(screen.getByText("Today")).not.toBeNull());
    expect(screen.getByText("Earlier this week")).not.toBeNull();
  });

  it("drops the group headers when sorting by progress", async () => {
    seedHistory([
      { slug: "alpha", pct: 0.3 },
      { slug: "beta", pct: 0.9, ageMs: 3 * DAY_MS },
    ]);
    render(<ShelfTabs manifest={manifest} />);
    await screen.findByRole("link", { name: ROW_TITLE });

    fireEvent.click(screen.getByRole("button", { name: PROGRESS_SORT }));

    expect(screen.queryByText("Today")).toBeNull();
    const links = screen.getAllByRole("link");
    expect(links[0]?.textContent).toContain("Beta Article");
    expect(links[1]?.textContent).toContain("Alpha Article");
  });

  it("keeps each row's marker fixed when the sort changes", async () => {
    seedHistory([
      { slug: "beta", pct: 0.3, firstAgeMs: 5 * DAY_MS },
      { slug: "alpha", pct: 0.9, ageMs: 3 * DAY_MS, firstAgeMs: 10 * DAY_MS },
    ]);
    render(<ShelfTabs manifest={manifest} />);
    await screen.findByRole("link", { name: ROW_TITLE });

    // Accession order is first-read order: alpha (older) is 01, beta is 02.
    expect(screen.getByText("C01")).not.toBeNull();
    expect(screen.getByText("S02")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: PROGRESS_SORT }));

    expect(screen.getAllByRole("link")[0]?.textContent).toContain(
      "Alpha Article"
    );
    expect(screen.getByText("C01")).not.toBeNull();
    expect(screen.getByText("S02")).not.toBeNull();
  });

  it("filters the list by domain chip and back to all", async () => {
    seedHistory([
      { slug: "alpha", pct: 0.6 },
      { slug: "beta", pct: 0.4 },
    ]);
    render(<ShelfTabs manifest={manifest} />);
    await screen.findByRole("link", { name: ROW_TITLE });

    fireEvent.click(screen.getByRole("button", { name: AGENT_SYSTEMS_CHIP }));
    expect(screen.queryByRole("link", { name: BETA_TITLE })).toBeNull();
    expect(screen.getByRole("link", { name: ROW_TITLE })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: ALL_CHIP }));
    expect(screen.getByRole("link", { name: BETA_TITLE })).not.toBeNull();
  });

  it("shows a domain-specific empty state when the filter matches nothing", async () => {
    seedHistory([
      { slug: "alpha", pct: 0.6 },
      { slug: "beta", pct: 0.4 },
    ]);
    render(<ShelfTabs manifest={manifest} />);
    await screen.findByRole("link", { name: ROW_TITLE });

    fireEvent.click(screen.getByRole("button", { name: AGENT_SYSTEMS_CHIP }));
    fireEvent.click(screen.getByRole("button", { name: REMOVE_ALPHA }));

    await waitFor(() =>
      expect(screen.getByText(FILTERED_EMPTY)).not.toBeNull()
    );
  });
});
