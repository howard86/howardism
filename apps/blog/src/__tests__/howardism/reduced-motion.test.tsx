import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  mock.restore();
});

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("no-preference") ? matches : !matches,
      media: query,
      onchange: null,
      addListener: (_: unknown) => undefined,
      removeListener: (_: unknown) => undefined,
      addEventListener: (_: unknown) => undefined,
      removeEventListener: (_: unknown) => undefined,
      dispatchEvent: (_: unknown) => false,
    }),
  });
}

describe("reduced-motion gating", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it("matchMedia returns false for no-preference when reduced-motion active", () => {
    const result = window.matchMedia("(prefers-reduced-motion: no-preference)");
    expect(result.matches).toBe(false);
  });

  it("matchMedia returns true for no-preference when motion allowed", () => {
    mockMatchMedia(true);
    const result = window.matchMedia("(prefers-reduced-motion: no-preference)");
    expect(result.matches).toBe(true);
  });

  it("matchMedia query result is independent per query string", () => {
    mockMatchMedia(true);
    const noPreference = window.matchMedia(
      "(prefers-reduced-motion: no-preference)"
    );
    expect(noPreference.matches).toBe(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    expect(reduce.matches).toBe(false);
  });

  it("document is accessible for stylesheet inspection", () => {
    expect(document).toBeDefined();
    expect(document.documentElement).toBeDefined();
  });
});
