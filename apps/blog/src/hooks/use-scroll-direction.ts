"use client";

import { useEffect, useState } from "react";

import { subscribeToArticleScroll } from "@/hooks/use-article-scroll";

export const SCROLL_DIRECTION_THRESHOLD_PX = 8;
export const SCROLL_DIRECTION_TOP_GUARD_PX = 80;

export type ScrollDirection = "up" | "down" | null;

export interface ScrollDirectionState {
  anchorY: number;
  direction: ScrollDirection;
  lastY: number;
}

export function advanceScrollDirection(
  state: ScrollDirectionState,
  scrollY: number,
  threshold = SCROLL_DIRECTION_THRESHOLD_PX,
  topGuard = SCROLL_DIRECTION_TOP_GUARD_PX
): ScrollDirectionState {
  if (scrollY < 0) {
    return { ...state, lastY: 0, anchorY: 0, direction: null };
  }
  if (scrollY < topGuard) {
    return { direction: null, lastY: scrollY, anchorY: scrollY };
  }
  const delta = scrollY - state.anchorY;
  if (Math.abs(delta) < threshold) {
    return { ...state, lastY: scrollY };
  }
  const direction = delta > 0 ? "down" : "up";
  return { direction, lastY: scrollY, anchorY: scrollY };
}

const INITIAL_STATE: ScrollDirectionState = {
  direction: null,
  lastY: 0,
  anchorY: 0,
};

function hasOpenBarOverlay(): boolean {
  return Boolean(
    document.querySelector(
      '[role="dialog"][data-state="open"], [data-radix-popper-content-wrapper], search[aria-label="Find in article"]'
    )
  );
}

export function useScrollDirection(
  enabled: boolean,
  paused: boolean
): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>(null);

  useEffect(() => {
    if (!enabled || paused) {
      setDirection(null);
      return;
    }
    let state = INITIAL_STATE;
    const unsubscribe = subscribeToArticleScroll([], (frame) => {
      if (!frame) {
        return;
      }
      const next = advanceScrollDirection(state, frame.scrollY);
      if (
        next.direction === "down" &&
        state.direction !== "down" &&
        hasOpenBarOverlay()
      ) {
        state = {
          ...state,
          direction: null,
          lastY: frame.scrollY,
          anchorY: frame.scrollY,
        };
        setDirection(null);
        return;
      }
      state = next;
      setDirection(state.direction);
    });
    const observer = new MutationObserver(() => {
      if (!hasOpenBarOverlay()) {
        return;
      }
      const scrollY = Math.max(0, window.scrollY);
      state = { anchorY: scrollY, direction: null, lastY: scrollY };
      setDirection(null);
    });
    observer.observe(document.body, {
      childList: true,
    });
    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, [enabled, paused]);

  return direction;
}
