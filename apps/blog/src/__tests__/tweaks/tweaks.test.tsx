import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { resolveTapAction } from "@/app/(blog)/articles/[slug]/tap-scroll-zones";
import {
  INIT_TWEAKS_SCRIPT,
  InitTweaksScript,
} from "@/components/tweaks/init-tweaks-script";
import { ReaderSettings } from "@/components/tweaks/reader-settings";
import { TweaksProvider, useTweaks } from "@/components/tweaks/tweaks-provider";
import { TWEAKS_STORAGE_KEY } from "@/components/tweaks/types";

afterEach(cleanup);

const READER_SETTINGS_LABEL = /reader settings/i;

// ── InitTweaksScript ────────────────────────────────────────────────────────

describe("init-tweaks-script", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-text-size");
  });

  it("renders a script tag", () => {
    const { container } = render(<InitTweaksScript />);
    expect(container.querySelector("script")).not.toBeNull();
  });

  it("applies dark mode when localStorage has mode dark", () => {
    localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify({ mode: "dark" }));
    // biome-ignore lint/security/noGlobalEval: intentional test of inline script
    eval(INIT_TWEAKS_SCRIPT);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("applies stored text size", () => {
    localStorage.setItem(
      TWEAKS_STORAGE_KEY,
      JSON.stringify({ mode: "light", textSize: "l" })
    );
    // biome-ignore lint/security/noGlobalEval: intentional test of inline script
    eval(INIT_TWEAKS_SCRIPT);
    expect(document.documentElement.dataset.textSize).toBe("l");
  });

  it("removes dark class when mode is light", () => {
    document.documentElement.classList.add("dark");
    localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify({ mode: "light" }));
    // biome-ignore lint/security/noGlobalEval: intentional test of inline script
    eval(INIT_TWEAKS_SCRIPT);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("does nothing when localStorage key is absent", () => {
    // biome-ignore lint/security/noGlobalEval: intentional test of inline script
    eval(INIT_TWEAKS_SCRIPT);
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

function TweaksDisplay() {
  const { state } = useTweaks();
  return (
    <span data-testid="tweaks-display">
      {state.mode}/{state.textSize}/{String(state.tapToScroll)}
    </span>
  );
}

describe("tweaks-provider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("data-text-size");
  });

  it("renders children", () => {
    render(
      <TweaksProvider>
        <span data-testid="child">hi</span>
      </TweaksProvider>
    );
    expect(screen.getByTestId("child")).not.toBeNull();
  });

  it("defaults to light / medium / tap-off when storage is empty", async () => {
    render(
      <TweaksProvider>
        <TweaksDisplay />
      </TweaksProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("tweaks-display").textContent).toBe(
        "light/m/false"
      )
    );
  });

  it("reads stored tweaks on mount and applies to DOM", async () => {
    localStorage.setItem(
      TWEAKS_STORAGE_KEY,
      JSON.stringify({
        mode: "dark",
        textSize: "l",
        tapToScroll: true,
        // legacy keys from removed features — must be ignored, not crash
        theme: "ink-blue",
        homeLayout: "classic",
      })
    );
    render(
      <TweaksProvider>
        <TweaksDisplay />
      </TweaksProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("tweaks-display").textContent).toBe(
        "dark/l/true"
      )
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.textSize).toBe("l");
  });

  it("falls back to defaults on malformed JSON in storage", async () => {
    localStorage.setItem(TWEAKS_STORAGE_KEY, "not-json");
    render(
      <TweaksProvider>
        <TweaksDisplay />
      </TweaksProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("tweaks-display").textContent).toBe(
        "light/m/false"
      )
    );
  });
});

// ── ReaderSettings (Aa popover + `t` shortcut) ──────────────────────────────

describe("reader-settings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the Aa trigger", () => {
    render(
      <TweaksProvider>
        <ReaderSettings />
      </TweaksProvider>
    );
    expect(
      screen.getByRole("button", { name: READER_SETTINGS_LABEL })
    ).not.toBeNull();
  });

  it("opens the popover on trigger click", async () => {
    render(
      <TweaksProvider>
        <ReaderSettings />
      </TweaksProvider>
    );
    const btn = screen.getByRole("button", { name: READER_SETTINGS_LABEL });
    fireEvent.click(btn);
    await waitFor(() => expect(btn.getAttribute("aria-expanded")).toBe("true"));
  });

  it("toggles the popover on T keydown", async () => {
    render(
      <TweaksProvider>
        <ReaderSettings />
      </TweaksProvider>
    );
    const btn = screen.getByRole("button", { name: READER_SETTINGS_LABEL });
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
        <ReaderSettings />
        <input data-testid="text-input" type="text" />
      </TweaksProvider>
    );
    const btn = screen.getByRole("button", { name: READER_SETTINGS_LABEL });
    const input = screen.getByTestId("text-input");
    fireEvent.keyDown(input, { key: "t", target: input });
    await new Promise((r) => setTimeout(r, 50));
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });
});

// ── tap-to-scroll hit-test ──────────────────────────────────────────────────

describe("resolveTapAction", () => {
  const VH = 1000;

  it("scrolls up for a tap in the top edge band", () => {
    expect(
      resolveTapAction({
        clientY: 100,
        viewportHeight: VH,
        isInteractive: false,
        moved: false,
      })
    ).toBe("up");
  });

  it("scrolls down for a tap in the bottom edge band", () => {
    expect(
      resolveTapAction({
        clientY: 900,
        viewportHeight: VH,
        isInteractive: false,
        moved: false,
      })
    ).toBe("down");
  });

  it("does nothing for a tap in the central reading zone", () => {
    expect(
      resolveTapAction({
        clientY: 500,
        viewportHeight: VH,
        isInteractive: false,
        moved: false,
      })
    ).toBe("none");
  });

  it("does nothing when the tap lands on an interactive element", () => {
    expect(
      resolveTapAction({
        clientY: 100,
        viewportHeight: VH,
        isInteractive: true,
        moved: false,
      })
    ).toBe("none");
  });

  it("does nothing for a drag (moved beyond threshold)", () => {
    expect(
      resolveTapAction({
        clientY: 900,
        viewportHeight: VH,
        isInteractive: false,
        moved: true,
      })
    ).toBe("none");
  });
});
