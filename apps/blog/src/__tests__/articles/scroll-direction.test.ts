import { describe, expect, it } from "bun:test";

import {
  advanceScrollDirection,
  type ScrollDirectionState,
} from "@/hooks/use-scroll-direction";

const initial: ScrollDirectionState = { direction: null, lastY: 0, anchorY: 0 };

describe("advanceScrollDirection", () => {
  it("ignores jitter until movement reaches the threshold", () => {
    const first = { ...initial, anchorY: 100, lastY: 100 };
    const jitter = advanceScrollDirection(first, 106);
    expect(jitter.direction).toBe(null);
    expect(advanceScrollDirection(jitter, 108).direction).toBe("down");
  });

  it("resets direction near the top and on iOS rubber-band positions", () => {
    const down = advanceScrollDirection(initial, 100);
    expect(advanceScrollDirection(down, 70).direction).toBe(null);
    expect(advanceScrollDirection(down, -12)).toEqual({
      anchorY: 0,
      direction: null,
      lastY: 0,
    });
  });

  it("restores the full bar after an upward threshold crossing", () => {
    const down = advanceScrollDirection(initial, 100);
    expect(advanceScrollDirection(down, 91).direction).toBe("up");
  });
});
