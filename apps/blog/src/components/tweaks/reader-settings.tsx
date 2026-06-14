"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@howardism/ui/components/popover";
import { Toggle } from "@howardism/ui/components/toggle";
import { useCallback, useEffect, useState } from "react";

import { clearReadingData } from "@/lib/reading-store";

import { useTweaks } from "./tweaks-provider";
import type { TextSize } from "./types";

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
];

const PILL_TOGGLE =
  "rounded-full data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-paper";

/**
 * The "Aa" reader-settings control in the site bar (article pages): text size
 * and the tap-to-scroll switch. Opens via its trigger or the `t` shortcut.
 */
export function ReaderSettings() {
  const { state, setTapToScroll, setTextSize } = useTweaks();
  const [open, setOpen] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClear = useCallback(() => {
    clearReadingData();
    setCleared(true);
  }, []);

  useEffect(() => {
    if (!cleared) {
      return;
    }
    const timer = setTimeout(() => setCleared(false), 2000);
    return () => clearTimeout(timer);
  }, [cleared]);

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
        aria-label="Reader settings"
        className="flex size-9 items-center justify-center rounded-full font-display text-[15px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <span aria-hidden="true">Aa</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60">
        <div className="flex flex-col gap-5">
          <section aria-label="Text size">
            <div className="mb-2.5 font-mono text-[0.6875rem] text-foreground-subtle uppercase tracking-[0.16em]">
              Text size
            </div>
            <fieldset
              aria-label="Select text size"
              className="m-0 inline-flex gap-1.5 rounded-full border-0 bg-background-2 p-1"
            >
              {TEXT_SIZES.map(({ value, label }) => (
                <Toggle
                  className={PILL_TOGGLE}
                  key={value}
                  onPressedChange={() => setTextSize(value)}
                  pressed={state.textSize === value}
                  size="sm"
                >
                  {label}
                </Toggle>
              ))}
            </fieldset>
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
              <span className="font-body text-[13px]">Tap screen edges</span>
              <span className="font-mono text-[0.6875rem] text-foreground-subtle">
                {state.tapToScroll ? "ON" : "OFF"}
              </span>
            </Toggle>
            <p className="mt-2 font-body text-[12px] text-foreground-subtle leading-snug">
              On touch devices, tap the top or bottom edge to scroll a screen.
            </p>
          </section>

          <section aria-label="Reading data">
            <div className="mb-2.5 font-mono text-[0.6875rem] text-foreground-subtle uppercase tracking-[0.16em]">
              Reading data
            </div>
            <button
              className="w-full rounded-full border border-border bg-background-2 px-3 py-1.5 font-body text-[13px] text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
              onClick={handleClear}
              type="button"
            >
              {cleared ? "Cleared" : "Clear reading data"}
            </button>
            <p className="mt-2 font-body text-[12px] text-foreground-subtle leading-snug">
              Erases your reading history, saved list, and in-article resume
              positions from this browser.
            </p>
          </section>
        </div>
      </PopoverContent>
    </Popover>
  );
}
