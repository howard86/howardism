"use client";

import { useCallback, useState } from "react";

import { clearReadingData } from "@/lib/reading-store";

export const READING_DATA_CLEARED_EVENT = "howardism:reading-data-cleared";

export function ClearReadingData() {
  const [confirming, setConfirming] = useState(false);

  const handleClear = useCallback(() => {
    clearReadingData();
    window.dispatchEvent(new Event(READING_DATA_CLEARED_EVENT));
    setConfirming(false);
  }, []);

  const handleClick = useCallback(() => {
    if (confirming) {
      handleClear();
      return;
    }
    setConfirming(true);
  }, [confirming, handleClear]);

  return (
    <div className="mt-5">
      <button
        className="rounded-full border border-border bg-background-2 px-3 py-1.5 font-body text-[13px] text-foreground-subtle transition-colors hover:bg-accent hover:text-foreground"
        onClick={handleClick}
        type="button"
      >
        {confirming ? "Confirm clear" : "Clear reading data"}
      </button>
      <p className="mt-2 font-body text-[12px] text-foreground-subtle leading-snug">
        Erases your reading history, saved list, and in-article resume positions
        from this browser.
      </p>
    </div>
  );
}
