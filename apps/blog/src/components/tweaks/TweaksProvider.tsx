"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  DEFAULT_TWEAKS,
  type HomeLayout,
  type Mode,
  type Theme,
  TWEAKS_STORAGE_KEY,
  type Tweaks,
} from "./types";

interface TweaksContextValue {
  setHomeLayout: (layout: HomeLayout) => void;
  setMode: (mode: Mode) => void;
  setTheme: (theme: Theme) => void;
  state: Tweaks;
}

const TweaksContext = createContext<TweaksContextValue | null>(null);

function applyToDom(tweaks: Tweaks) {
  document.documentElement.dataset.theme = tweaks.theme;
  document.documentElement.classList.toggle("dark", tweaks.mode === "dark");
}

function readStorage(): Tweaks {
  try {
    const raw = localStorage.getItem(TWEAKS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_TWEAKS;
    }
    const parsed = JSON.parse(raw) as Partial<Tweaks>;
    return {
      theme: parsed.theme ?? DEFAULT_TWEAKS.theme,
      mode: parsed.mode ?? DEFAULT_TWEAKS.mode,
      homeLayout: parsed.homeLayout ?? DEFAULT_TWEAKS.homeLayout,
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

  const setTheme = useCallback((theme: Theme) => {
    setState((prev) => {
      const next = { ...prev, theme };
      writeStorage(next);
      applyToDom(next);
      return next;
    });
  }, []);

  const setMode = useCallback((mode: Mode) => {
    setState((prev) => {
      const next = { ...prev, mode };
      writeStorage(next);
      applyToDom(next);
      return next;
    });
  }, []);

  const setHomeLayout = useCallback((homeLayout: HomeLayout) => {
    setState((prev) => {
      const next = { ...prev, homeLayout };
      writeStorage(next);
      return next;
    });
  }, []);

  return (
    <TweaksContext value={{ state, setTheme, setMode, setHomeLayout }}>
      {children}
    </TweaksContext>
  );
}

export function useTweaks(): TweaksContextValue {
  const ctx = useContext(TweaksContext);
  if (!ctx) {
    throw new Error("useTweaks must be used inside TweaksProvider");
  }
  return ctx;
}
