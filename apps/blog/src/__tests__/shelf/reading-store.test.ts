import { afterEach, describe, expect, it, spyOn } from "bun:test";

import {
  clearReadingData,
  getHistory,
  getSaved,
  isSaved,
  perSlugKey,
  recordProgress,
  removeFromHistory,
  toggleSave,
} from "@/lib/reading-store";

afterEach(() => {
  localStorage.clear();
});

const HISTORY_KEY = "howardism:reading-history";
const CAP = 50;

describe("reading-store", () => {
  it("records a read once it crosses the 25% threshold", () => {
    recordProgress("alpha", 0.3);
    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.slug).toBe("alpha");
    expect(history[0]?.pct).toBe(0.3);
  });

  it("ignores scrolls below the 25% threshold", () => {
    recordProgress("barely", 0.1);
    expect(getHistory()).toHaveLength(0);
  });

  it("moves a re-read slug to the front and refreshes its progress", () => {
    recordProgress("alpha", 0.3);
    recordProgress("beta", 0.4);
    recordProgress("alpha", 0.9);
    const history = getHistory();
    expect(history.map((entry) => entry.slug)).toEqual(["alpha", "beta"]);
    expect(history[0]?.pct).toBe(0.9);
  });

  it("caps history at 50, evicting the oldest read and its resume state", () => {
    for (let i = 0; i <= CAP; i += 1) {
      localStorage.setItem(
        perSlugKey(`slug-${i}`),
        JSON.stringify({ headingId: "h", pct: 0.5 })
      );
      recordProgress(`slug-${i}`, 0.5);
    }

    const history = getHistory();
    expect(history).toHaveLength(CAP);
    // slug-0 was the oldest read — evicted past the cap...
    expect(history.some((entry) => entry.slug === "slug-0")).toBe(false);
    // ...and its per-slug resume state is dropped with it.
    expect(localStorage.getItem(perSlugKey("slug-0"))).toBeNull();
    // The newest read survives, resume state intact.
    expect(history[0]?.slug).toBe(`slug-${CAP}`);
    expect(localStorage.getItem(perSlugKey(`slug-${CAP}`))).not.toBeNull();
  });

  it("returns an empty history when storage is empty or corrupt", () => {
    expect(getHistory()).toEqual([]);
    localStorage.setItem(HISTORY_KEY, "{not-json");
    expect(getHistory()).toEqual([]);
  });

  it("removes one read and drops its per-slug resume state, leaving the rest", () => {
    localStorage.setItem(
      perSlugKey("beta"),
      JSON.stringify({ headingId: "h", pct: 0.5 })
    );
    recordProgress("alpha", 0.3);
    recordProgress("beta", 0.4);

    removeFromHistory("beta");

    expect(getHistory().map((entry) => entry.slug)).toEqual(["alpha"]);
    expect(localStorage.getItem(perSlugKey("beta"))).toBeNull();
  });

  it("swallows storage write errors instead of throwing (private browsing)", () => {
    const spy = spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    expect(() => recordProgress("gamma", 0.6)).not.toThrow();
    spy.mockRestore();
  });
});

describe("reading-store save-for-later", () => {
  it("toggles a save on and off, persisting and reporting the new state", () => {
    expect(isSaved("alpha")).toBe(false);

    expect(toggleSave("alpha")).toBe(true);
    expect(isSaved("alpha")).toBe(true);
    expect(getSaved().map((entry) => entry.slug)).toEqual(["alpha"]);

    expect(toggleSave("alpha")).toBe(false);
    expect(isSaved("alpha")).toBe(false);
    expect(getSaved()).toEqual([]);
  });

  it("orders saves newest-first", () => {
    toggleSave("alpha");
    toggleSave("beta");
    toggleSave("gamma");
    expect(getSaved().map((entry) => entry.slug)).toEqual([
      "gamma",
      "beta",
      "alpha",
    ]);
  });

  it("never caps the saved list", () => {
    for (let i = 0; i < 60; i += 1) {
      toggleSave(`slug-${i}`);
    }
    expect(getSaved()).toHaveLength(60);
  });

  it("returns an empty saved list when storage is empty or corrupt", () => {
    expect(getSaved()).toEqual([]);
    localStorage.setItem("howardism:reading-saved", "{not-json");
    expect(getSaved()).toEqual([]);
  });
});

describe("reading-store clearReadingData", () => {
  it("wipes history, the saved list, and every per-slug resume entry", () => {
    recordProgress("alpha", 0.4);
    toggleSave("beta");
    localStorage.setItem(
      perSlugKey("alpha"),
      JSON.stringify({ headingId: "h", pct: 0.4 })
    );
    localStorage.setItem(
      perSlugKey("gamma"),
      JSON.stringify({ headingId: "h", pct: 0.5 })
    );
    // An unrelated namespace must survive the wipe.
    localStorage.setItem("howardism:tweaks", "{}");

    clearReadingData();

    expect(getHistory()).toEqual([]);
    expect(getSaved()).toEqual([]);
    expect(localStorage.getItem(perSlugKey("alpha"))).toBeNull();
    expect(localStorage.getItem(perSlugKey("gamma"))).toBeNull();
    expect(localStorage.getItem("howardism:tweaks")).not.toBeNull();
  });
});
