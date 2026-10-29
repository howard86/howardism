"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@howardism/ui/components/popover";
import { Toggle } from "@howardism/ui/components/toggle";
import { useCallback, useEffect, useState } from "react";

import { useArticleNav } from "@/components/article-nav-context";

import { useTweaks } from "./tweaks-provider";
import type { TextSize } from "./types";

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
];
const MODES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

const PILL_TOGGLE =
  "rounded-full data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-paper";

/**
 * Site-wide display controls, with article-only reading controls when the
 * current route publishes article navigation. Opens via its trigger or `t`.
 */
/**
 * One text-size pill. A component rather than an inline `onPressedChange` so
 * each pill keeps a stable handler across the group's re-renders.
 */
function TextSizeToggle({
  label,
  onSelect,
  pressed,
  value,
}: {
  label: string;
  onSelect: (value: TextSize) => void;
  pressed: boolean;
  value: TextSize;
}) {
  const handlePressedChange = useCallback(
    () => onSelect(value),
    [onSelect, value]
  );
  return (
    <Toggle
      className={PILL_TOGGLE}
      onPressedChange={handlePressedChange}
      pressed={pressed}
      size="sm"
    >
      {label}
    </Toggle>
  );
}

function ModeToggle({
  label,
  mode,
  onSelect,
  pressed,
}: {
  label: string;
  mode: "light" | "dark";
  onSelect: (mode: "light" | "dark") => void;
  pressed: boolean;
}) {
  const handlePressedChange = useCallback(
    () => onSelect(mode),
    [mode, onSelect]
  );
  return (
    <Toggle
      className={PILL_TOGGLE}
      onPressedChange={handlePressedChange}
      pressed={pressed}
      size="sm"
    >
      {label}
    </Toggle>
  );
}

export function ReaderSettings() {
  const { state, setFocusMode, setMode, setTapToScroll, setTextSize } =
    useTweaks();
  const articleNav = useArticleNav();
  const [open, setOpen] = useState(false);

  // Focus mode collapses the bar this popover is anchored to, so close it too.
  const handleFocusMode = useCallback(
    (pressed: boolean) => {
      setFocusMode(pressed);
      if (pressed) {
        setOpen(false);
      }
    },
    [setFocusMode]
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== "t" && e.key !== "T") {
      return;
    }
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        aria-label="Display settings"
        className="flex size-9 items-center justify-center rounded-full font-display text-[15px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <span aria-hidden="true">Aa</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60">
        <div className="flex flex-col gap-5">
          <section aria-label="Theme">
            <div className="mb-2.5 font-mono text-[0.6875rem] text-foreground-subtle uppercase tracking-[0.16em]">
              Theme
            </div>
            <fieldset
              aria-label="Select theme"
              className="m-0 inline-flex gap-1.5 rounded-full border-0 bg-background-2 p-1"
            >
              {MODES.map(({ value, label }) => (
                <ModeToggle
                  key={value}
                  label={label}
                  mode={value}
                  onSelect={setMode}
                  pressed={state.mode === value}
                />
              ))}
            </fieldset>
          </section>
          <section aria-label="Text size">
            <div className="mb-2.5 font-mono text-[0.6875rem] text-foreground-subtle uppercase tracking-[0.16em]">
              Text size
            </div>
            <fieldset
              aria-label="Select text size"
              className="m-0 inline-flex gap-1.5 rounded-full border-0 bg-background-2 p-1"
            >
              {TEXT_SIZES.map(({ value, label }) => (
                <TextSizeToggle
                  key={value}
                  label={label}
                  onSelect={setTextSize}
                  pressed={state.textSize === value}
                  value={value}
                />
              ))}
            </fieldset>
          </section>

          {articleNav ? (
            <>
              <section aria-label="Focus mode">
                <div className="mb-2.5 font-mono text-[0.6875rem] text-foreground-subtle uppercase tracking-[0.16em]">
                  Focus mode
                </div>
                <Toggle
                  className={`${PILL_TOGGLE} w-full justify-between gap-2 px-3`}
                  onPressedChange={handleFocusMode}
                  pressed={state.focusMode}
                  size="sm"
                >
                  <span className="font-body text-[13px]">
                    Hide the site bar
                  </span>
                  <span className="font-mono text-[0.6875rem] text-foreground-subtle">
                    {state.focusMode ? "ON" : "OFF"}
                  </span>
                </Toggle>
              </section>
              <section aria-label="Tap to scroll">
                <div className="mb-2.5 font-mono text-[0.6875rem] text-foreground-subtle uppercase tracking-[0.16em]">
                  Tap to scroll
                </div>
                <Toggle
                  className={`${PILL_TOGGLE} w-full justify-between gap-2 px-3`}
                  onPressedChange={setTapToScroll}
                  pressed={state.tapToScroll}
                  size="sm"
                >
                  <span className="font-body text-[13px]">
                    Tap screen edges
                  </span>
                  <span className="font-mono text-[0.6875rem] text-foreground-subtle">
                    {state.tapToScroll ? "ON" : "OFF"}
                  </span>
                </Toggle>
                <p className="mt-2 font-body text-[12px] text-foreground-subtle leading-snug">
                  On touch devices, tap the top or bottom edge to scroll a
                  screen.
                </p>
              </section>
            </>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
