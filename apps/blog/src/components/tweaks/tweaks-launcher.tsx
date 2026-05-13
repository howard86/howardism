"use client";

import { Button } from "@howardism/ui/components/button";
import { useCallback, useEffect, useState } from "react";

import { TweaksPanel } from "./tweaks-panel";

export function TweaksLauncher() {
  const [open, setOpen] = useState(false);

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
    <>
      <Button
        aria-expanded={open}
        aria-label="Open Tweaks panel"
        className="fixed right-5 bottom-5 z-50 size-11 rounded-full border-input bg-card text-base shadow-paper-lg transition-transform hover:scale-105 dark:bg-card dark:hover:bg-card"
        onClick={() => setOpen((prev) => !prev)}
        size="icon"
        type="button"
        variant="outline"
      >
        ✨
      </Button>
      <TweaksPanel onOpenChange={setOpen} open={open} />
    </>
  );
}
