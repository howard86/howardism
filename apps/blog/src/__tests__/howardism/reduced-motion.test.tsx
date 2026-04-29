import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render } from "@testing-library/react";

const NO_PREF_BLOCK_RE =
  /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{([^}]+)\}/;
const NO_PREF_BLOCK_GLOBAL_RE =
  /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{[^}]+\}/g;

afterEach(() => {
  cleanup();
  mock.restore();
});

function mockMatchMedia(prefersReducedMotion: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("no-preference")
        ? !prefersReducedMotion
        : prefersReducedMotion,
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
    mockMatchMedia(true);
  });

  it("matchMedia returns false for no-preference when reduced-motion active", () => {
    const result = window.matchMedia("(prefers-reduced-motion: no-preference)");
    expect(result.matches).toBe(false);
  });

  it("matchMedia returns true for no-preference when motion allowed", () => {
    mockMatchMedia(false);
    const result = window.matchMedia("(prefers-reduced-motion: no-preference)");
    expect(result.matches).toBe(true);
  });

  it("matchMedia query result is independent per query string", () => {
    mockMatchMedia(false);
    const noPreference = window.matchMedia(
      "(prefers-reduced-motion: no-preference)"
    );
    expect(noPreference.matches).toBe(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    expect(reduce.matches).toBe(false);
  });

  it("hw-page-enter animation is gated inside @media no-preference block in CSS source", () => {
    const cssPath = join(import.meta.dir, "../../styles/howardism.css");
    const css = readFileSync(cssPath, "utf-8");
    const noPreferenceBlock = css.match(NO_PREF_BLOCK_RE);
    expect(noPreferenceBlock).not.toBeNull();
    expect(noPreferenceBlock?.[1]).toContain("hw-page-enter");
    const outsideBlock = css.replace(NO_PREF_BLOCK_GLOBAL_RE, "");
    expect(outsideBlock).not.toContain(".hw-page-enter {");
  });

  it("hw-page-enter element has no animation-name in happy-dom (no @media eval)", () => {
    mockMatchMedia(true);
    const { container } = render(<div className="hw-page-enter">content</div>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("hw-page-enter");
    const style = window.getComputedStyle(el);
    expect(style.animationName === "none" || style.animationName === "").toBe(
      true
    );
  });
});
