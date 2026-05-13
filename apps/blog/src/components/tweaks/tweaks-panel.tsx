"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@howardism/ui/components/sheet";
import { Toggle } from "@howardism/ui/components/toggle";
import type { Dispatch, SetStateAction } from "react";

import { useTweaks } from "./tweaks-provider";
import type { Mode } from "./types";

const MODES: { value: Mode; label: string }[] = [
  { value: "light", label: "☀ Light" },
  { value: "dark", label: "☽ Dark" },
];

interface TweaksPanelProps {
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  open: boolean;
}

export function TweaksPanel({ open, onOpenChange }: TweaksPanelProps) {
  const { state, setMode } = useTweaks();

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent aria-label="Tweaks panel" side="right">
        <SheetHeader>
          <SheetTitle className="font-display text-lg tracking-[-0.015em]">
            Tweaks
          </SheetTitle>
          <SheetDescription className="font-mono text-[0.6875rem]">
            Adjust colour mode
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          <section aria-label="Mode">
            <div className="mb-2.5 font-mono text-[0.6875rem] text-foreground-subtle uppercase tracking-[0.16em]">
              Mode
            </div>
            <fieldset
              aria-label="Select mode"
              className="m-0 inline-flex gap-1.5 rounded-full border-0 bg-background-2 p-1"
            >
              {MODES.map(({ value, label }) => (
                <Toggle
                  className="rounded-full data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-paper"
                  key={value}
                  onPressedChange={() => setMode(value)}
                  pressed={state.mode === value}
                  size="sm"
                >
                  {label}
                </Toggle>
              ))}
            </fieldset>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
