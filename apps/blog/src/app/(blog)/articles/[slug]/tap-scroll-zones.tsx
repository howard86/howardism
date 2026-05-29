"use client";

import { useEffect } from "react";

import { useTweaks } from "@/components/tweaks/tweaks-provider";

const EDGE_BAND = 0.22; // top/bottom 22% of the viewport are tap zones
const SCROLL_FRACTION = 0.9; // scroll ~90% of a screen, keeping ~10% overlap
const MOVE_THRESHOLD_PX = 10; // beyond this a pointer is a drag/selection, not a tap
const INTERACTIVE_SELECTOR =
  "a, button, summary, label, input, textarea, select, [role]";

export type TapAction = "up" | "down" | "none";

/**
 * Pure hit-test for a tap: which scroll action (if any) an "empty" tap in the
 * edge bands maps to. Returns "none" for drags, taps on interactive elements,
 * or taps in the central reading zone — so links and text selection always win.
 */
export function resolveTapAction({
  clientY,
  viewportHeight,
  isInteractive,
  moved,
}: {
  clientY: number;
  viewportHeight: number;
  isInteractive: boolean;
  moved: boolean;
}): TapAction {
  if (moved || isInteractive || viewportHeight <= 0) {
    return "none";
  }
  if (clientY < viewportHeight * EDGE_BAND) {
    return "up";
  }
  if (clientY > viewportHeight * (1 - EDGE_BAND)) {
    return "down";
  }
  return "none";
}

/**
 * E-reader tap-to-scroll. Touch devices only, opt-in via Tweaks. A tap in the
 * top edge band scrolls up ~90vh, the bottom band scrolls down; taps on links/
 * controls follow them (no overlay — we listen and conditionally act). Renders
 * nothing.
 */
export function TapScrollZones() {
  const { state } = useTweaks();
  const enabled = state.tapToScroll;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (!window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    let startX = 0;
    let startY = 0;

    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const moved =
        Math.abs(e.clientX - startX) > MOVE_THRESHOLD_PX ||
        Math.abs(e.clientY - startY) > MOVE_THRESHOLD_PX;
      const isInteractive =
        e.target instanceof Element &&
        e.target.closest(INTERACTIVE_SELECTOR) !== null;
      const action = resolveTapAction({
        clientY: e.clientY,
        viewportHeight: window.innerHeight,
        isInteractive,
        moved,
      });
      if (action === "none") {
        return;
      }
      const delta = window.innerHeight * SCROLL_FRACTION;
      window.scrollBy({
        top: action === "up" ? -delta : delta,
        behavior: "smooth",
      });
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerup", onPointerUp, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [enabled]);

  return null;
}
