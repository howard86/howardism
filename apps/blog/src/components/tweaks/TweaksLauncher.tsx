"use client";

import { useCallback, useEffect, useState } from "react";

import { TweaksPanel } from "./TweaksPanel";

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
      <button
        aria-expanded={open}
        aria-label="Open Tweaks panel"
        className="hw-tweaks-launcher"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        ✨
      </button>
      <TweaksPanel onOpenChange={setOpen} open={open} />
    </>
  );
}
