import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  INIT_TWEAKS_SCRIPT,
  InitTweaksScript,
} from "@/components/tweaks/InitTweaksScript";
import { TweaksLauncher } from "@/components/tweaks/TweaksLauncher";
import { TweaksProvider, useTweaks } from "@/components/tweaks/TweaksProvider";
import { TWEAKS_STORAGE_KEY } from "@/components/tweaks/types";

afterEach(cleanup);

const OPEN_TWEAKS_LABEL = /open tweaks panel/i;

// ── InitTweaksScript ────────────────────────────────────────────────────────

describe("InitTweaksScript", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("dark");
  });

  it("renders a script tag", () => {
    const { container } = render(<InitTweaksScript />);
    expect(container.querySelector("script")).not.toBeNull();
  });

  it("applies stored theme and dark mode when localStorage has valid data", () => {
    localStorage.setItem(
      TWEAKS_STORAGE_KEY,
      JSON.stringify({ theme: "moss", mode: "dark" })
    );
    // biome-ignore lint/security/noGlobalEval: intentional test of inline script
    eval(INIT_TWEAKS_SCRIPT);
    expect(document.documentElement.dataset.theme).toBe("moss");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class when mode is light", () => {
    document.documentElement.classList.add("dark");
    localStorage.setItem(
      TWEAKS_STORAGE_KEY,
      JSON.stringify({ theme: "plum", mode: "light" })
    );
    // biome-ignore lint/security/noGlobalEval: intentional test of inline script
    eval(INIT_TWEAKS_SCRIPT);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("does nothing when localStorage key is absent", () => {
    // biome-ignore lint/security/noGlobalEval: intentional test of inline script
    eval(INIT_TWEAKS_SCRIPT);
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("does not throw on malformed JSON", () => {
    localStorage.setItem(TWEAKS_STORAGE_KEY, "{bad json");
    expect(() => {
      // biome-ignore lint/security/noGlobalEval: intentional test of inline script
      eval(INIT_TWEAKS_SCRIPT);
    }).not.toThrow();
  });
});

// ── TweaksProvider ──────────────────────────────────────────────────────────

function ThemeDisplay() {
  const { state } = useTweaks();
  return <span data-testid="theme-display">{state.theme}</span>;
}

describe("TweaksProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("dark");
  });

  it("renders children", () => {
    render(
      <TweaksProvider>
        <span data-testid="child">hi</span>
      </TweaksProvider>
    );
    expect(screen.getByTestId("child")).not.toBeNull();
  });

  it("defaults to terracotta/light when storage is empty", async () => {
    render(
      <TweaksProvider>
        <ThemeDisplay />
      </TweaksProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("theme-display").textContent).toBe("terracotta")
    );
  });

  it("reads stored theme on mount and applies to DOM", async () => {
    localStorage.setItem(
      TWEAKS_STORAGE_KEY,
      JSON.stringify({
        theme: "ink-blue",
        mode: "light",
        homeLayout: "classic",
      })
    );
    render(
      <TweaksProvider>
        <ThemeDisplay />
      </TweaksProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("theme-display").textContent).toBe("ink-blue")
    );
    expect(document.documentElement.dataset.theme).toBe("ink-blue");
  });

  it("applies dark class to documentElement when stored mode is dark", async () => {
    localStorage.setItem(
      TWEAKS_STORAGE_KEY,
      JSON.stringify({ theme: "terracotta", mode: "dark", homeLayout: "disc" })
    );
    render(
      <TweaksProvider>
        <ThemeDisplay />
      </TweaksProvider>
    );
    await waitFor(() =>
      expect(document.documentElement.classList.contains("dark")).toBe(true)
    );
  });

  it("falls back to defaults on malformed JSON in storage", async () => {
    localStorage.setItem(TWEAKS_STORAGE_KEY, "not-json");
    render(
      <TweaksProvider>
        <ThemeDisplay />
      </TweaksProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("theme-display").textContent).toBe("terracotta")
    );
  });
});

// ── TweaksLauncher ──────────────────────────────────────────────────────────

describe("TweaksLauncher", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the launcher button", () => {
    render(
      <TweaksProvider>
        <TweaksLauncher />
      </TweaksProvider>
    );
    expect(
      screen.getByRole("button", { name: OPEN_TWEAKS_LABEL })
    ).not.toBeNull();
  });

  it("opens the panel on button click", async () => {
    render(
      <TweaksProvider>
        <TweaksLauncher />
      </TweaksProvider>
    );
    const btn = screen.getByRole("button", { name: OPEN_TWEAKS_LABEL });
    fireEvent.click(btn);
    await waitFor(() => expect(btn.getAttribute("aria-expanded")).toBe("true"));
  });

  it("toggles panel open on T keydown", async () => {
    render(
      <TweaksProvider>
        <TweaksLauncher />
      </TweaksProvider>
    );
    const btn = screen.getByRole("button", { name: OPEN_TWEAKS_LABEL });
    fireEvent.keyDown(document, { key: "t" });
    await waitFor(() => expect(btn.getAttribute("aria-expanded")).toBe("true"));
    fireEvent.keyDown(document, { key: "T" });
    await waitFor(() =>
      expect(btn.getAttribute("aria-expanded")).toBe("false")
    );
  });

  it("does not toggle when T is pressed inside an input", async () => {
    render(
      <TweaksProvider>
        <TweaksLauncher />
        <input data-testid="text-input" type="text" />
      </TweaksProvider>
    );
    const btn = screen.getByRole("button", { name: OPEN_TWEAKS_LABEL });
    const input = screen.getByTestId("text-input");
    fireEvent.keyDown(input, { key: "t", target: input });
    // Give React a tick to process the event
    await new Promise((r) => setTimeout(r, 50));
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });
});
