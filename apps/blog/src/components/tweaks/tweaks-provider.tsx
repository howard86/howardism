"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_TWEAKS,
  type Mode,
  type TextSize,
  TWEAKS_STORAGE_KEY,
  type Tweaks,
} from "./types";

interface TweaksContextValue {
  setMode: (mode: Mode) => void;
  setTapToScroll: (tapToScroll: boolean) => void;
  setTextSize: (textSize: TextSize) => void;
  state: Tweaks;
}

const TweaksContext = createContext<TweaksContextValue | null>(null);

function applyToDom(tweaks: Tweaks) {
  document.documentElement.classList.toggle("dark", tweaks.mode === "dark");
  document.documentElement.dataset.textSize = tweaks.textSize;
}

function readStorage(): Tweaks {
  try {
    const raw = localStorage.getItem(TWEAKS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_TWEAKS;
    }
    const parsed = JSON.parse(raw) as Partial<Tweaks>;
    return {
      mode: parsed.mode ?? DEFAULT_TWEAKS.mode,
      tapToScroll: parsed.tapToScroll ?? DEFAULT_TWEAKS.tapToScroll,
      textSize: parsed.textSize ?? DEFAULT_TWEAKS.textSize,
    };
  } catch {
    return DEFAULT_TWEAKS;
  }
}

function writeStorage(tweaks: Tweaks) {
  try {
    localStorage.setItem(TWEAKS_STORAGE_KEY, JSON.stringify(tweaks));
  } catch {
    // storage quota exceeded or private browsing — silently ignore
  }
}

export function TweaksProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Tweaks>(DEFAULT_TWEAKS);

  useEffect(() => {
    const stored = readStorage();
    setState(stored);
    applyToDom(stored);
  }, []);

  const setMode = useCallback((mode: Mode) => {
    setState((prev) => {
      if (prev.mode === mode) {
        return prev;
      }
      const next = { ...prev, mode };
      writeStorage(next);
      applyToDom(next);
      return next;
    });
  }, []);

  const setTapToScroll = useCallback((tapToScroll: boolean) => {
    setState((prev) => {
      if (prev.tapToScroll === tapToScroll) {
        return prev;
      }
      const next = { ...prev, tapToScroll };
      writeStorage(next);
      return next;
    });
  }, []);

  const setTextSize = useCallback((textSize: TextSize) => {
    setState((prev) => {
      if (prev.textSize === textSize) {
        return prev;
      }
      const next = { ...prev, textSize };
      writeStorage(next);
      applyToDom(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ state, setMode, setTapToScroll, setTextSize }),
    [state, setMode, setTapToScroll, setTextSize]
  );

  return <TweaksContext value={value}>{children}</TweaksContext>;
}

export function useTweaks(): TweaksContextValue {
  const ctx = useContext(TweaksContext);
  if (!ctx) {
    throw new Error("useTweaks must be used inside TweaksProvider");
  }
  return ctx;
}
