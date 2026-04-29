"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@howardism/ui/components/sheet";
import { usePathname } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";

import { useTweaks } from "./TweaksProvider";
import type { HomeLayout, Mode, Theme } from "./types";

const THEME_SWATCHES: { value: Theme; color: string; label: string }[] = [
  { value: "terracotta", color: "oklch(0.58 0.14 35)", label: "Terracotta" },
  { value: "moss", color: "oklch(0.52 0.1 145)", label: "Moss" },
  { value: "ink-blue", color: "oklch(0.48 0.12 245)", label: "Ink Blue" },
  { value: "plum", color: "oklch(0.48 0.13 340)", label: "Plum" },
  { value: "ochre", color: "oklch(0.56 0.16 75)", label: "Ochre" },
];

const HOME_LAYOUTS: { value: HomeLayout; label: string }[] = [
  { value: "disc", label: "Disc" },
  { value: "classic", label: "Classic" },
  { value: "statement", label: "Statement" },
  { value: "index", label: "Index" },
];

interface TweetsPanelProps {
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  open: boolean;
}

export function TweaksPanel({ open, onOpenChange }: TweetsPanelProps) {
  const { state, setTheme, setMode, setHomeLayout } = useTweaks();
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent aria-label="Tweaks panel" side="right">
        <SheetHeader>
          <SheetTitle className="hw-display" style={{ fontSize: 17 }}>
            Tweaks
          </SheetTitle>
        </SheetHeader>

        <div
          style={{
            padding: "0 16px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Theme swatches */}
          <section aria-label="Theme">
            <div className="hw-eyebrow" style={{ marginBottom: 10 }}>
              Theme
            </div>
            <fieldset
              aria-label="Select theme"
              className="hw-swatch-row"
              style={{ border: "none", padding: 0, margin: 0 }}
            >
              {THEME_SWATCHES.map(({ value, color, label }) => (
                <button
                  aria-label={label}
                  aria-pressed={state.theme === value}
                  className={`hw-swatch${state.theme === value ? "active" : ""}`}
                  key={value}
                  onClick={() => setTheme(value)}
                  style={{ background: color }}
                  type="button"
                />
              ))}
            </fieldset>
          </section>

          {/* Mode toggle */}
          <section aria-label="Mode">
            <div className="hw-eyebrow" style={{ marginBottom: 10 }}>
              Mode
            </div>
            <fieldset
              aria-label="Select mode"
              className="hw-mode-toggle"
              style={{ border: "none", padding: 0, margin: 0 }}
            >
              {(["light", "dark"] as Mode[]).map((m) => (
                <button
                  aria-pressed={state.mode === m}
                  key={m}
                  onClick={() => setMode(m)}
                  type="button"
                >
                  {m === "light" ? "☀ Light" : "☽ Dark"}
                </button>
              ))}
            </fieldset>
          </section>

          {/* Home layout — only interactive when on / */}
          <section aria-label="Home layout">
            <div className="hw-eyebrow" style={{ marginBottom: 10 }}>
              Home layout
            </div>
            <fieldset
              aria-label="Select home layout"
              className="hw-mode-toggle"
              style={{
                border: "none",
                padding: 0,
                margin: 0,
                flexWrap: "wrap",
              }}
            >
              {HOME_LAYOUTS.map(({ value, label }) => (
                <button
                  aria-pressed={state.homeLayout === value}
                  disabled={!isHome}
                  key={value}
                  onClick={() => isHome && setHomeLayout(value)}
                  style={{ opacity: isHome ? 1 : 0.45 }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </fieldset>
            {!isHome && (
              <p
                className="hw-mono"
                style={{ fontSize: 10, color: "var(--hw-ink-3)", marginTop: 6 }}
              >
                Available on the home page
              </p>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
